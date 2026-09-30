from datetime import date

from rest_framework import status
from rest_framework.test import APITestCase

from apps.families.enums import FamilyRole
from apps.families.models import Family, FamilyMember
from apps.finance.enums import CategoryType, RecurrenceFrequency
from apps.finance.models import Expense, FinancialCategory, Income, RecurringTransaction
from apps.finance.services import GenerateRecurringTransactionsService
from apps.finance.utils import occurrence_date
from apps.users.models import User

URL = "/api/finances/recurring/"


class OccurrenceDateTests(APITestCase):
    def test_monthly_keeps_original_day_after_short_month(self):
        start = date(2026, 1, 31)

        self.assertEqual(occurrence_date(start, RecurrenceFrequency.MONTHLY, 1), date(2026, 2, 28))
        self.assertEqual(occurrence_date(start, RecurrenceFrequency.MONTHLY, 2), date(2026, 3, 31))

    def test_weekly_and_yearly(self):
        self.assertEqual(occurrence_date(date(2026, 1, 1), RecurrenceFrequency.WEEKLY, 2), date(2026, 1, 15))
        self.assertEqual(occurrence_date(date(2024, 2, 29), RecurrenceFrequency.YEARLY, 1), date(2025, 2, 28))


class RecurringTransactionTests(APITestCase):
    def setUp(self):
        self.family = Family.objects.create(name="Família Teste")
        self.user = self.create_member("autor@example.com", FamilyRole.OWNER)
        self.other = self.create_member("outro@example.com", FamilyRole.MEMBER)
        self.expense_category = FinancialCategory.objects.create(name="Moradia", type=CategoryType.EXPENSE)
        self.income_category = FinancialCategory.objects.create(name="Salário", type=CategoryType.INCOME)
        self.client.force_authenticate(self.user)

    def create_member(self, email, role):
        user = User.objects.create_user(email=email, password="senha-teste", first_name=email.split("@")[0])
        FamilyMember.objects.create(family=self.family, user=user, role=role)
        user.current_family = self.family
        user.save(update_fields=["current_family"])

        return user

    def payload(self, **overrides):
        data = {
            "type": CategoryType.EXPENSE,
            "amount": "1850.00",
            "category": self.expense_category.id,
            "frequency": RecurrenceFrequency.MONTHLY,
            "start_date": "2999-01-05",
        }
        data.update(overrides)

        return data

    def test_create_in_the_future_does_not_generate_entries(self):
        response = self.client.post(URL, self.payload())

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["next_date"], "2999-01-05")
        self.assertFalse(Expense.objects.exists())

    def test_create_with_past_start_generates_missed_entries(self):
        response = self.client.post(URL, self.payload(start_date="2020-01-05", end_date="2020-03-20"))

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            list(Expense.objects.order_by("date").values_list("date", flat=True)),
            [date(2020, 1, 5), date(2020, 2, 5), date(2020, 3, 5)],
        )
        self.assertFalse(response.data["is_active"])
        self.assertEqual(Expense.objects.first().created_by_id, self.user.id)

    def test_income_recurrence_creates_incomes(self):
        self.client.post(
            URL,
            self.payload(type=CategoryType.INCOME, category=self.income_category.id, start_date="2020-01-01", end_date="2020-01-01"),
        )

        self.assertEqual(Income.objects.count(), 1)
        self.assertFalse(Expense.objects.exists())

    def test_generate_is_idempotent(self):
        RecurringTransaction.objects.create(
            family=self.family, type=CategoryType.EXPENSE, amount="10.00", category=self.expense_category,
            frequency=RecurrenceFrequency.WEEKLY, start_date=date(2026, 1, 1), next_date=date(2026, 1, 1),
            created_by=self.user,
        )

        first = GenerateRecurringTransactionsService.execute(today=date(2026, 1, 15))
        second = GenerateRecurringTransactionsService.execute(today=date(2026, 1, 15))

        self.assertEqual((first, second), (3, 0))

    def test_rejects_category_of_other_type(self):
        response = self.client.post(URL, self.payload(category=self.income_category.id))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("category", response.data)

    def test_rejects_end_before_start(self):
        response = self.client.post(URL, self.payload(end_date="2998-01-01"))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("end_date", response.data)

    def test_other_member_can_list_but_not_change(self):
        recurring_id = self.client.post(URL, self.payload()).data["id"]
        self.client.force_authenticate(self.other)

        listing = self.client.get(URL)
        update = self.client.patch(f"{URL}{recurring_id}/", {"amount": "1.00"})
        delete = self.client.delete(f"{URL}{recurring_id}/")

        self.assertEqual([item["id"] for item in listing.data], [recurring_id])
        self.assertEqual(update.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(delete.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_pause_and_delete(self):
        recurring_id = self.client.post(URL, self.payload()).data["id"]

        pause = self.client.patch(f"{URL}{recurring_id}/", {"is_active": False})
        delete = self.client.delete(f"{URL}{recurring_id}/")

        self.assertEqual(pause.status_code, status.HTTP_200_OK)
        self.assertFalse(pause.data["is_active"])
        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)

    def test_cannot_create_without_family(self):
        user = User.objects.create_user(email="sem.familia@example.com", password="senha-teste")
        self.client.force_authenticate(user)

        response = self.client.post(URL, self.payload())

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
