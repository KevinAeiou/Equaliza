from rest_framework import status
from rest_framework.test import APITestCase

from apps.families.enums import FamilyRole
from apps.families.models import Family, FamilyMember
from apps.finance.enums import CategoryType
from apps.finance.models import Expense, FinancialCategory, Income
from apps.users.models import User

EXPENSES = "/api/finances/expenses/"
INCOME = "/api/finances/income/"


class CategoryTypeValidationTests(APITestCase):
    def setUp(self):
        family = Family.objects.create(name="Família Teste")
        user = User.objects.create_user(email="autor@example.com", password="senha-teste", first_name="Autor")
        FamilyMember.objects.create(family=family, user=user, role=FamilyRole.OWNER)
        user.current_family = family
        user.save(update_fields=["current_family"])
        self.client.force_authenticate(user)

        self.expense_category = FinancialCategory.objects.create(name="Mercado", type=CategoryType.EXPENSE)
        self.income_category = FinancialCategory.objects.create(name="Salário", type=CategoryType.INCOME)

    def post(self, url, category):
        return self.client.post(url, {"amount": "10.00", "category": category.pk}, format="json")

    def test_expense_accepts_an_expense_category(self):
        response = self.post(EXPENSES, self.expense_category)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_income_accepts_an_income_category(self):
        response = self.post(INCOME, self.income_category)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_expense_rejects_an_income_category(self):
        response = self.post(EXPENSES, self.income_category)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["category"][0], "Categoria inválida para uma despesa.")
        self.assertFalse(Expense.objects.exists())

    def test_income_rejects_an_expense_category(self):
        response = self.post(INCOME, self.expense_category)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["category"][0], "Categoria inválida para uma receita.")
        self.assertFalse(Income.objects.exists())
