from rest_framework import status
from rest_framework.test import APITestCase

from apps.finance.enums import CategoryType
from apps.finance.models import Expense, FinancialCategory, Income
from apps.users.models import User


class FinanceWithoutFamilyTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="sem.familia@example.com", password="senha-teste")
        self.client.force_authenticate(self.user)

    def test_cannot_create_expense_without_family(self):
        category = FinancialCategory.objects.create(name="Mercado", type=CategoryType.EXPENSE)

        response = self.client.post(
            "/api/finances/expenses/",
            {"amount": "50.00", "category": category.id},
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("família", response.data["detail"])
        self.assertFalse(Expense.objects.exists())

    def test_cannot_create_income_without_family(self):
        category = FinancialCategory.objects.create(name="Salário", type=CategoryType.INCOME)

        response = self.client.post(
            "/api/finances/income/",
            {"amount": "50.00", "category": category.id},
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Income.objects.exists())

    def test_can_list_expenses_without_family(self):
        response = self.client.get("/api/finances/expenses/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cannot_create_category_without_family(self):
        response = self.client.post(
            "/api/finances/categories/",
            {"name": "Viagens", "type": CategoryType.EXPENSE},
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("família", response.data["detail"])
        self.assertFalse(FinancialCategory.objects.filter(name="Viagens").exists())

    def test_can_list_categories_without_family(self):
        response = self.client.get("/api/finances/categories/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
