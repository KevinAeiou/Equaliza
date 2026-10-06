from datetime import date
from decimal import Decimal

from rest_framework.test import APITestCase

from apps.families.enums import FamilyRole
from apps.families.models import Family, FamilyMember
from apps.finance.enums import CategoryType
from apps.finance.models import Expense, FinancialCategory, Income
from apps.finance.services import GenerateRecurringTransactionsService
from apps.users.models import User

EXPENSES = "/api/finances/expenses/"
CHARTS = "/api/reports/dashboard/charts/"


class PerformanceTests(APITestCase):
    def setUp(self):
        self.family = Family.objects.create(name="Família Teste")
        self.user = self.create_member("autor@example.com", FamilyRole.OWNER)
        self.other = self.create_member("outro@example.com", FamilyRole.MEMBER)
        self.food = FinancialCategory.objects.create(name="Mercado", type=CategoryType.EXPENSE)
        self.rent = FinancialCategory.objects.create(name="Moradia", type=CategoryType.EXPENSE)
        self.salary = FinancialCategory.objects.create(name="Salário", type=CategoryType.INCOME)
        self.client.force_authenticate(self.user)

    def create_member(self, email, role):
        user = User.objects.create_user(email=email, password="senha-teste", first_name=email.split("@")[0])
        FamilyMember.objects.create(family=self.family, user=user, role=role)
        user.current_family = self.family
        user.save(update_fields=["current_family"])

        return user

    def expense(self, amount, day, category, user=None):
        return Expense.objects.create(
            family=self.family,
            amount=Decimal(amount),
            date=day,
            category=category,
            created_by=user or self.user,
            updated_by=user or self.user,
        )

    def test_listing_without_page_size_keeps_the_plain_list(self):
        for day in range(1, 4):
            self.expense("10.00", date(2026, 1, day), self.food)

        response = self.client.get(EXPENSES)

        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 3)

    def test_listing_with_page_size_is_paginated(self):
        for day in range(1, 6):
            self.expense("10.00", date(2026, 1, day), self.food)

        response = self.client.get(EXPENSES, {"page_size": 2})

        self.assertEqual(response.data["count"], 5)
        self.assertEqual(len(response.data["results"]), 2)
        self.assertIsNotNone(response.data["next"])

    def test_generation_without_due_entries_is_a_single_query(self):
        with self.assertNumQueries(1):
            created = GenerateRecurringTransactionsService.execute(family=self.family)

        self.assertEqual(created, 0)

    def test_dashboard_charts_aggregate_months_categories_and_members(self):
        self.expense("100.00", date(2026, 1, 10), self.food)
        self.expense("50.00", date(2026, 2, 10), self.food, user=self.other)
        self.expense("300.00", date(2026, 2, 15), self.rent)
        Income.objects.create(
            family=self.family,
            amount=Decimal("1000.00"),
            date=date(2026, 1, 5),
            category=self.salary,
            created_by=self.user,
            updated_by=self.user,
        )

        response = self.client.get(CHARTS, {"from_date": "2026-01-01", "to_date": "2026-02-28"})

        months = response.data["income_vs_expense"]
        self.assertEqual([item["period"] for item in months], ["2026-01", "2026-02"])
        self.assertEqual([Decimal(str(item["expense"])) for item in months], [Decimal("100"), Decimal("350")])
        self.assertEqual(Decimal(str(months[0]["income"])), Decimal("1000"))

        categories = response.data["expenses_by_category"]
        self.assertEqual([item["category"] for item in categories], ["Moradia", "Mercado"])
        self.assertEqual(Decimal(str(categories[1]["value"])), Decimal("150"))

        members = {item["member"]: item for item in response.data["member_contributions"]}
        self.assertEqual(Decimal(str(members["autor"]["paid"])), Decimal("400"))
        self.assertEqual(Decimal(str(members["outro"]["paid"])), Decimal("50"))
