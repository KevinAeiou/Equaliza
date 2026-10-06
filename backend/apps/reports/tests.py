from datetime import date

from rest_framework import status
from rest_framework.test import APITestCase

from apps.families.enums import FamilyRole
from apps.families.models import Family, FamilyMember
from apps.finance.enums import CategoryType, RecurrenceFrequency
from apps.finance.models import Expense, FinancialCategory, Income, RecurringTransaction
from apps.reports.insights import MONTH, WEEK, Entry, Recurring, build_insights, shift_period
from apps.users.models import User

_ids = iter(range(1, 10_000))
_CATEGORIES = {}


def expense(category, amount, when):
    category_id = _CATEGORIES.setdefault(category, len(_CATEGORIES) + 1)

    return Entry(when, category_id, category, category, float(amount))


def history(per_month, months=6):
    return [expense(name, amount, date(2026, 10 - i, 10)) for i in range(1, months + 1) for name, amount in per_month.items()]


def build(current, past, today=date(2026, 11, 20), **kwargs):
    return build_insights(MONTH, date(2026, 10, 1), date(2026, 10, 31), current, past, today, **kwargs)


def kinds(report):
    return [item["kind"] for item in report["insights"]]


class ShiftPeriodTests(APITestCase):
    def test_month_crosses_year(self):
        self.assertEqual(shift_period(MONTH, date(2026, 1, 1), date(2026, 1, 31), -1), (date(2025, 12, 1), date(2025, 12, 31)))

    def test_week(self):
        self.assertEqual(shift_period(WEEK, date(2026, 10, 4), date(2026, 10, 10), -1), (date(2026, 9, 27), date(2026, 10, 3)))


class BuildInsightsTests(APITestCase):
    def test_without_expenses_there_are_no_insights(self):
        report = build([], history({"Moradia": 2000}))

        self.assertFalse(report["has_expenses"])
        self.assertEqual(report["insights"], [])

    def test_without_history_uses_only_the_period(self):
        report = build(
            [
                expense("Moradia", 1800, date(2026, 10, 5)),
                expense("Mercado", 300, date(2026, 10, 6)),
                expense("Lazer", 100, date(2026, 10, 7)),
            ],
            [],
        )

        self.assertTrue(report["has_expenses"])
        self.assertFalse(report["has_history"])
        self.assertFalse(report["has_previous"])
        self.assertEqual(report["comparisons"], [])
        self.assertTrue(set(kinds(report)) <= {"largest_expense", "concentration"})

    def test_single_previous_period_is_not_enough_for_average(self):
        report = build([expense("Moradia", 2760, date(2026, 10, 5))], history({"Moradia": 2000}, months=1))

        self.assertFalse(report["has_history"])
        self.assertEqual(report["history_periods"], 1)
        self.assertNotIn("above_average", kinds(report))

    def test_category_above_average(self):
        report = build(
            [expense("Moradia", 2760, date(2026, 10, 5)), expense("Lazer", 300, date(2026, 10, 8))],
            history({"Moradia": 2000, "Lazer": 300}),
        )
        insight = next(item for item in report["insights"] if item["kind"] == "above_average")

        self.assertEqual(insight["title"], "Moradia ficou 38% acima da sua média")
        self.assertEqual(insight["tone"], "alert")
        self.assertEqual(report["above_count"], 1)
        self.assertEqual(insight["bars"][0]["value"], "R$\xa02.760,00")

    def test_margin_until_average_when_ongoing(self):
        report = build([expense("Lazer", 120, date(2026, 10, 3))], history({"Lazer": 310}), today=date(2026, 10, 15))
        insight = next(item for item in report["insights"] if item["kind"] == "below_average")

        self.assertIn("faltam R$\xa0190,00", insight["title"])
        self.assertAlmostEqual(insight["progress"]["fraction"], 120 / 310, places=3)

    def test_drop_against_previous_period(self):
        past = [e for e in history({"Transporte": 410}, months=5) if e.date.month != 9]
        past.append(expense("Transporte", 420, date(2026, 9, 10)))

        report = build([expense("Transporte", 328, date(2026, 10, 5))], past)
        drop = next(item for item in report["insights"] if item["kind"] == "drop")

        self.assertEqual(drop["title"], "Transporte caiu 22% em relação ao mês anterior")
        self.assertEqual(drop["tone"], "good")

    def test_ongoing_period_is_compared_at_the_same_point(self):
        report = build(
            [expense("Mercado", 100, date(2026, 10, 2))],
            [*history({"Mercado": 100}), expense("Mercado", 900, date(2026, 9, 25))],
            today=date(2026, 10, 10),
        )

        # O gasto de 25/09 fica depois do dia 10 e não entra na comparação.
        self.assertFalse({"drop", "total_change"} & set(kinds(report)))

    def test_rising_trend(self):
        past = [
            expense("Mercado", 1000, date(2026, 7, 10)),
            expense("Mercado", 1050, date(2026, 8, 10)),
            expense("Mercado", 1200, date(2026, 9, 10)),
            expense("Lazer", 100, date(2026, 7, 12)),
            expense("Lazer", 110, date(2026, 8, 12)),
            expense("Lazer", 130, date(2026, 9, 12)),
        ]
        report = build([expense("Mercado", 1500, date(2026, 10, 5)), expense("Lazer", 150, date(2026, 10, 6))], past)
        insight = next(item for item in report["insights"] if item["kind"] == "trend")

        self.assertEqual(insight["title"], "Lazer vem subindo há 3 meses")
        self.assertEqual([point["label"] for point in insight["spark"]], ["Jul", "Ago", "Set", "Out"])

    def test_stable_history_has_no_alerts(self):
        report = build(
            [expense("Moradia", 2000, date(2026, 10, 5)), expense("Lazer", 300, date(2026, 10, 6))],
            history({"Moradia": 2000, "Lazer": 300}),
        )

        self.assertTrue(report["has_history"])
        self.assertEqual([item for item in report["insights"] if item["tone"] != "neutral"], [])
        self.assertEqual(report["above_count"], 0)

    def test_expenses_above_income(self):
        report = build([expense("Moradia", 3000, date(2026, 10, 5))], [], income=2500.0)
        insight = next(item for item in report["insights"] if item["kind"] == "savings")

        self.assertEqual(insight["tone"], "alert")
        self.assertIn("R$\xa0500,00 a mais", insight["title"])

    def test_savings_rate(self):
        report = build([expense("Moradia", 1000, date(2026, 10, 5))], [], income=5000.0)
        insight = next(item for item in report["insights"] if item["kind"] == "savings")

        self.assertEqual(insight["tone"], "good")
        self.assertEqual(insight["title"], "Você guardou 80% da receita")

    def test_no_savings_insight_without_income(self):
        report = build([expense("Moradia", 1000, date(2026, 10, 5))], [], income=None)

        self.assertNotIn("savings", kinds(report))

    def test_projection_for_ongoing_period(self):
        report = build(
            [expense("Mercado", 1000, date(2026, 10, 3))],
            history({"Mercado": 1500}),
            today=date(2026, 10, 10),
        )
        insight = next(item for item in report["insights"] if item["kind"] == "projection")

        # 1000 em 10 dias de 31 → 3.100 projetados, contra média de 1.500.
        self.assertIn("R$\xa03.100,00", insight["title"])
        self.assertEqual(insight["tone"], "alert")

    def test_no_projection_early_in_the_period(self):
        report = build([expense("Mercado", 1000, date(2026, 10, 1))], history({"Mercado": 1500}), today=date(2026, 10, 2))

        self.assertNotIn("projection", kinds(report))

    def test_weekday_concentration(self):
        saturdays = [date(2026, 10, day) for day in (3, 10, 17, 24, 31)]
        report = build(
            [*(expense("Lazer", 200, day) for day in saturdays), *(expense("Mercado", 20, date(2026, 10, day)) for day in (5, 6, 7))],
            [],
        )
        insight = next(item for item in report["insights"] if item["kind"] == "weekday")

        self.assertTrue(insight["title"].startswith("Sábados concentram"))
        self.assertEqual(len(insight["spark"]), 7)
        self.assertEqual([p["label"] for p in insight["spark"] if p["highlighted"]], ["Sáb"])

    def test_upcoming_recurring_expenses(self):
        recurring = [
            Recurring(1, "Aluguel", 1500.0, RecurrenceFrequency.MONTHLY, date(2026, 1, 25), None, 9),
            Recurring(2, "Seguro", 20.0, RecurrenceFrequency.MONTHLY, date(2026, 1, 28), None, 9),
        ]
        report = build([expense("Mercado", 400, date(2026, 10, 3))], [], today=date(2026, 10, 10), recurring=recurring)
        insight = next(item for item in report["insights"] if item["kind"] == "upcoming")

        self.assertIn("R$\xa01.520,00", insight["title"])
        self.assertIn("Aluguel", insight["body"])
        self.assertIn("25/10", insight["body"])

    def test_no_upcoming_for_closed_period(self):
        recurring = [Recurring(1, "Aluguel", 1500.0, RecurrenceFrequency.MONTHLY, date(2026, 1, 25), None, 9)]
        report = build([expense("Mercado", 400, date(2026, 10, 3))], [], today=date(2026, 11, 20), recurring=recurring)

        self.assertNotIn("upcoming", kinds(report))


class DashboardInsightsEndpointTests(APITestCase):
    URL = "/api/reports/dashboard/insights/"

    def setUp(self):
        self.family = Family.objects.create(name="Família Teste")
        self.user = User.objects.create_user(email="autor@example.com", password="senha-teste", first_name="Autor")
        FamilyMember.objects.create(family=self.family, user=self.user, role=FamilyRole.OWNER)
        self.user.current_family = self.family
        self.user.save(update_fields=["current_family"])
        self.category = FinancialCategory.objects.create(name="Moradia", type=CategoryType.EXPENSE)
        self.income_category = FinancialCategory.objects.create(name="Salário", type=CategoryType.INCOME)
        self.client.force_authenticate(self.user)

    def add_expense(self, amount, when, category=None):
        return Expense.objects.create(family=self.family, amount=amount, date=when, category=category or self.category)

    def query(self, **extra):
        return {"from_date": "2026-10-01", "to_date": "2026-10-31", "period_type": "MONTH", **extra}

    def test_requires_authentication(self):
        self.client.force_authenticate(None)

        self.assertEqual(self.client.get(self.URL, self.query()).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_requires_period(self):
        response = self.client.get(self.URL)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_period(self):
        response = self.client.get(self.URL, self.query())

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["has_expenses"])

    def test_report_for_family_expenses(self):
        for month in range(4, 10):
            self.add_expense("2000.00", date(2026, month, 10))

        self.add_expense("2760.00", date(2026, 10, 5))
        Income.objects.create(family=self.family, amount="9000.00", date=date(2026, 10, 1), category=self.income_category)

        response = self.client.get(self.URL, self.query())

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["has_history"])
        self.assertEqual(response.data["history_periods"], 6)
        self.assertEqual(response.data["insights"][0]["kind"], "above_average")
        self.assertIn("38% acima da sua média", response.data["insights"][0]["title"])
        self.assertEqual(response.data["comparisons"][0]["name"], "Moradia")

    def test_other_family_expenses_are_ignored(self):
        other = Family.objects.create(name="Outra")
        Expense.objects.create(family=other, amount="500.00", date=date(2026, 10, 5), category=self.category)

        response = self.client.get(self.URL, self.query())

        self.assertFalse(response.data["has_expenses"])

    def test_category_filter(self):
        other = FinancialCategory.objects.create(name="Lazer", type=CategoryType.EXPENSE)
        self.add_expense("100.00", date(2026, 10, 5), other)

        response = self.client.get(self.URL, self.query(categories=[self.category.id]))

        self.assertFalse(response.data["has_expenses"])

    def test_recurring_expenses_do_not_break_the_report(self):
        self.add_expense("400.00", date(2026, 10, 3))
        RecurringTransaction.objects.create(
            family=self.family,
            type=CategoryType.EXPENSE,
            amount="1500.00",
            category=self.category,
            frequency=RecurrenceFrequency.MONTHLY,
            start_date=date(2026, 1, 25),
            next_date=date(2026, 10, 25),
            generated_count=9,
        )

        response = self.client.get(self.URL, self.query())

        self.assertEqual(response.status_code, status.HTTP_200_OK)
