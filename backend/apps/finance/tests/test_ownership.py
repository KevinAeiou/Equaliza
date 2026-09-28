from rest_framework import status
from rest_framework.test import APITestCase

from apps.families.enums import FamilyRole
from apps.families.models import Family, FamilyMember
from apps.finance.enums import CategoryType
from apps.finance.models import Expense, FinancialCategory, Income
from apps.users.models import User


class FinanceOwnershipTests(APITestCase):
    def setUp(self):
        self.family = Family.objects.create(name="Família Teste")
        self.author = self.create_member("autor@example.com", FamilyRole.OWNER)
        self.other = self.create_member("outro@example.com", FamilyRole.MEMBER)

        category = FinancialCategory.objects.create(name="Mercado", type=CategoryType.EXPENSE)
        self.expense = Expense.objects.create(
            family=self.family,
            category=category,
            amount="80.00",
            created_by=self.author,
            updated_by=self.author,
        )

        income_category = FinancialCategory.objects.create(name="Salário", type=CategoryType.INCOME)
        self.income = Income.objects.create(
            family=self.family,
            category=income_category,
            amount="3000.00",
            created_by=self.author,
            updated_by=self.author,
        )

    def create_member(self, email, role):
        user = User.objects.create_user(email=email, password="senha-teste", first_name=email.split("@")[0])
        FamilyMember.objects.create(family=self.family, user=user, role=role)
        user.current_family = self.family
        user.save(update_fields=["current_family"])

        return user

    def test_family_members_see_each_others_entries(self):
        self.client.force_authenticate(self.other)

        response = self.client.get("/api/finances/expenses/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data], [self.expense.id])
        self.assertEqual(response.data[0]["created_by"]["id"], self.author.id)

    def test_other_member_cannot_update_or_delete(self):
        self.client.force_authenticate(self.other)

        update = self.client.patch(f"/api/finances/expenses/{self.expense.id}/", {"amount": "1.00"})
        delete = self.client.delete(f"/api/finances/expenses/{self.expense.id}/")
        delete_income = self.client.delete(f"/api/finances/income/{self.income.id}/")

        self.assertEqual(update.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(delete.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(delete_income.status_code, status.HTTP_403_FORBIDDEN)

        self.expense.refresh_from_db()
        self.assertEqual(str(self.expense.amount), "80.00")
        self.assertTrue(Income.objects.filter(pk=self.income.pk).exists())

    def test_author_can_update_and_delete(self):
        self.client.force_authenticate(self.author)

        update = self.client.patch(f"/api/finances/expenses/{self.expense.id}/", {"amount": "95.50"})

        self.assertEqual(update.status_code, status.HTTP_200_OK)
        self.expense.refresh_from_db()
        self.assertEqual(str(self.expense.amount), "95.50")

        delete = self.client.delete(f"/api/finances/expenses/{self.expense.id}/")

        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Expense.objects.filter(pk=self.expense.pk).exists())
