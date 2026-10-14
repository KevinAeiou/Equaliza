from rest_framework import status
from rest_framework.test import APITestCase

from apps.families.enums import FamilyRole
from apps.families.models import Family, FamilyMember
from apps.finance.enums import CategoryType
from apps.finance.models import Expense, FinancialCategory
from apps.users.models import User


class FinanceExportTests(APITestCase):
    def setUp(self):
        self.family = Family.objects.create(name="Família Teste")
        self.user = self.create_user("autor@example.com", self.family)
        self.outsider = self.create_user("fora@example.com", Family.objects.create(name="Outra"))
        self.category = FinancialCategory.objects.create(name="Mercado", type=CategoryType.EXPENSE)

        self.create_expense(self.user, "10.50", "=HYPERLINK(\"http://x\")", "2026-01-10")
        self.create_expense(self.user, "20.00", "Feira <b>", "2026-02-10")
        self.create_expense(self.outsider, "99.00", "Segredo", "2026-01-10")

    def create_user(self, email, family):
        user = User.objects.create_user(email=email, password="senha-teste", first_name=email.split("@")[0])
        FamilyMember.objects.create(family=family, user=user, role=FamilyRole.OWNER)
        user.current_family = family
        user.save(update_fields=["current_family"])

        return user

    def create_expense(self, user, amount, description, date):
        return Expense.objects.create(
            family=user.current_family,
            category=self.category,
            amount=amount,
            description=description,
            date=date,
            created_by=user,
            updated_by=user,
        )

    def export(self, **params):
        self.client.force_authenticate(self.user)

        return self.client.get("/api/finances/expenses/export/", params)

    def test_csv_neutralizes_formulas_and_isolates_family(self):
        response = self.export(export_format="csv")
        body = response.content.decode("utf-8-sig")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("attachment", response["Content-Disposition"])
        self.assertIn("'=HYPERLINK", body)
        self.assertNotIn(";=HYPERLINK", body)
        self.assertIn("10,50", body)
        self.assertNotIn("Segredo", body)

    def test_csv_respects_filters(self):
        body = self.export(export_format="csv", from_date="2026-02-01").content.decode("utf-8-sig")

        self.assertIn("Feira", body)
        self.assertNotIn("10,50", body)

    def test_pdf_is_generated(self):
        response = self.export(export_format="pdf")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF"))

    def test_invalid_format_is_rejected(self):
        self.assertEqual(self.export(export_format="xls").status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.export().status_code, status.HTTP_400_BAD_REQUEST)

    def test_requires_authentication(self):
        self.client.force_authenticate(None)

        response = self.client.get("/api/finances/expenses/export/", {"export_format": "csv"})

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
