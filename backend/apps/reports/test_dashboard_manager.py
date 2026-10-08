from datetime import date
from decimal import Decimal

from rest_framework.test import APITestCase

from apps.families.enums import FamilyRole
from apps.families.models import Family, FamilyMember
from apps.finance.enums import CategoryType
from apps.finance.models import Expense, FinancialCategory, Income
from apps.users.models import User

SUMMARY = "/api/reports/dashboard/summary/"
CHARTS = "/api/reports/dashboard/charts/"
PERIOD = {"from_date": "2026-01-01", "to_date": "2026-02-28"}


def amount(value):
    return Decimal(str(value))


class DashboardManagerTests(APITestCase):
    """Valores exatos do dashboard: protegem a refatoração do DashboardManager."""

    def setUp(self):
        self.family = Family.objects.create(name="Família Teste")
        self.ana = self.member("ana@example.com", FamilyRole.OWNER)
        self.bia = self.member("bia@example.com", FamilyRole.MEMBER)
        self.food = FinancialCategory.objects.create(name="Mercado", type=CategoryType.EXPENSE)
        self.rent = FinancialCategory.objects.create(name="Moradia", type=CategoryType.EXPENSE)
        self.salary = FinancialCategory.objects.create(name="Salário", type=CategoryType.INCOME)
        self.client.force_authenticate(self.ana)

        self.income("3000.00", date(2026, 1, 5), self.ana)
        self.income("1000.00", date(2026, 2, 5), self.bia)
        self.expense("400.00", date(2026, 1, 10), self.food, self.ana)
        self.expense("200.00", date(2026, 2, 10), self.food, self.bia)
        self.expense("650.00", date(2026, 2, 15), self.rent, self.ana)

    def member(self, email, role):
        user = User.objects.create_user(
            email=email, password="senha-teste", first_name=email.split("@")[0], last_name="Silva"
        )
        FamilyMember.objects.create(family=self.family, user=user, role=role)
        user.current_family = self.family
        user.save(update_fields=["current_family"])

        return user

    def income(self, value, day, user):
        Income.objects.create(
            family=self.family, amount=Decimal(value), date=day, category=self.salary,
            created_by=user, updated_by=user,
        )

    def expense(self, value, day, category, user):
        Expense.objects.create(
            family=self.family, amount=Decimal(value), date=day, category=category,
            created_by=user, updated_by=user,
        )

    def test_summary(self):
        data = self.client.get(SUMMARY, PERIOD).data

        self.assertEqual(amount(data["income"]), Decimal("4000"))
        self.assertEqual(amount(data["expense"]), Decimal("1250"))
        self.assertEqual(amount(data["balance"]), Decimal("2750"))
        self.assertEqual(data["members"], 2)

    def test_summary_respects_the_period(self):
        data = self.client.get(SUMMARY, {"from_date": "2026-02-01", "to_date": "2026-02-28"}).data

        self.assertEqual(amount(data["income"]), Decimal("1000"))
        self.assertEqual(amount(data["expense"]), Decimal("850"))

    def test_summary_category_filter(self):
        data = self.client.get(SUMMARY, {**PERIOD, "categories": [self.rent.pk]}).data

        self.assertEqual(amount(data["expense"]), Decimal("650"))
        self.assertEqual(amount(data["income"]), Decimal("0"))

    def test_summary_without_data_is_zero(self):
        data = self.client.get(SUMMARY, {"from_date": "2020-01-01", "to_date": "2020-01-31"}).data

        self.assertEqual(
            (amount(data["income"]), amount(data["expense"]), amount(data["balance"])),
            (Decimal("0"), Decimal("0"), Decimal("0")),
        )

    def test_months(self):
        months = self.client.get(CHARTS, PERIOD).data["income_vs_expense"]

        self.assertEqual(
            [(m["period"], amount(m["income"]), amount(m["expense"])) for m in months],
            [("2026-01", Decimal("3000"), Decimal("400")), ("2026-02", Decimal("1000"), Decimal("850"))],
        )

    def test_month_with_only_one_kind_has_zero_on_the_other(self):
        self.income("500.00", date(2026, 3, 1), self.ana)

        months = self.client.get(CHARTS, {"from_date": "2026-03-01", "to_date": "2026-03-31"}).data[
            "income_vs_expense"
        ]

        self.assertEqual(len(months), 1)
        self.assertEqual((months[0]["period"], amount(months[0]["income"]), amount(months[0]["expense"])), ("2026-03", Decimal("500"), Decimal("0")))

    def test_categories_are_sorted_by_value(self):
        categories = self.client.get(CHARTS, PERIOD).data["expenses_by_category"]

        self.assertEqual(
            [(c["category"], amount(c["value"])) for c in categories],
            [("Moradia", Decimal("650")), ("Mercado", Decimal("600"))],
        )

    def test_member_contributions_follow_income_proportion(self):
        members = {m["member"]: m for m in self.client.get(CHARTS, PERIOD).data["member_contributions"]}

        # Ana ganhou 3000 de 4000 (75%): deveria pagar 75% dos 1250 gastos.
        self.assertEqual(
            (amount(members["ana Silva"]["expected"]), amount(members["ana Silva"]["paid"]), amount(members["ana Silva"]["difference"])),
            (Decimal("937.50"), Decimal("1050"), Decimal("112.50")),
        )
        self.assertEqual(
            (amount(members["bia Silva"]["expected"]), amount(members["bia Silva"]["paid"]), amount(members["bia Silva"]["difference"])),
            (Decimal("312.50"), Decimal("200"), Decimal("-112.50")),
        )

    def test_member_contributions_without_income_expect_nothing(self):
        Income.objects.all().delete()

        members = self.client.get(CHARTS, PERIOD).data["member_contributions"]

        self.assertTrue(all(amount(m["expected"]) == 0 for m in members))

    def test_other_families_are_ignored(self):
        outsider_family = Family.objects.create(name="Outra")
        outsider = User.objects.create_user(email="x@example.com", password="senha-teste")
        Expense.objects.create(
            family=outsider_family, amount=Decimal("9999.00"), date=date(2026, 1, 20),
            category=self.food, created_by=outsider, updated_by=outsider,
        )

        data = self.client.get(SUMMARY, PERIOD).data
        categories = self.client.get(CHARTS, PERIOD).data["expenses_by_category"]

        self.assertEqual(amount(data["expense"]), Decimal("1250"))
        self.assertEqual(sum(amount(c["value"]) for c in categories), Decimal("1250"))
