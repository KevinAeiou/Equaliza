from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.families.enums import FamilyRole
from apps.families.models import Family, FamilyMember
from apps.finance.enums import CategoryType
from apps.finance.models import Expense, FinancialCategory
from apps.imports.enums import PendingStatus
from apps.imports.models import ImportBatch, PendingTransaction
from apps.imports.tests.helpers import zipcrypto_zip
from apps.imports.tests.test_csv_parser import C6_CARD, NUBANK_STATEMENT
from apps.users.models import User

OFX = b"""<OFX><BANKMSGSRSV1><STMTTRN><DTPOSTED>20260801</DTPOSTED><TRNAMT>-1.00</TRNAMT></STMTTRN></BANKMSGSRSV1></OFX>"""


@override_settings(STATEMENT_IMPORT_ENABLED=True)
class ImportApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = self.create_user("a@example.com")
        self.other = self.create_user("b@example.com")
        self.family = Family.objects.create(name="Casa")
        FamilyMember.objects.create(family=self.family, user=self.user, role=FamilyRole.OWNER)
        self.foreign_family = Family.objects.create(name="Outra")
        FamilyMember.objects.create(family=self.foreign_family, user=self.other, role=FamilyRole.OWNER)
        self.user.current_family = self.family
        self.user.save(update_fields=["current_family"])
        self.category = FinancialCategory.objects.create(name="Mercado", type=CategoryType.EXPENSE)
        self.income_category = FinancialCategory.objects.create(name="Salário", type=CategoryType.INCOME)
        self.client.force_authenticate(self.user)

    def create_user(self, email):
        return User.objects.create_user(email=email, password="x", first_name=email[0])

    def upload(self, content=NUBANK_STATEMENT, source="STATEMENT", name="extrato.csv", **extra):
        return self.client.post(
            "/api/imports/",
            {"file": SimpleUploadedFile(name, content), "source": source, **extra},
            format="multipart",
        )

    def pending(self, **filters):
        return PendingTransaction.objects.filter(owner=self.user, **filters)

    # --- flag e autenticação

    @override_settings(STATEMENT_IMPORT_ENABLED=False)
    def test_disabled_flag_hides_every_route(self):
        for url in ("/api/imports/", "/api/pending-transactions/", "/api/imports/csv-mappings/"):
            self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

        self.assertEqual(self.upload().status_code, status.HTTP_404_NOT_FOUND)

    def test_requires_authentication(self):
        self.client.force_authenticate(None)

        self.assertEqual(self.client.get("/api/pending-transactions/").status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.upload().status_code, status.HTTP_401_UNAUTHORIZED)

    # --- envio

    def test_upload_creates_batch_and_pending_without_keeping_the_file(self):
        response = self.upload()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            (response.data["rows_total"], response.data["rows_new"], response.data["pending_count"]), (3, 3, 3)
        )
        self.assertEqual(self.pending().count(), 3)
        self.assertNotIn("name", response.data)
        self.assertNotIn("extrato.csv", str(ImportBatch.objects.values()))

    def test_reupload_does_not_duplicate(self):
        self.upload()
        response = self.upload()

        self.assertEqual((response.data["rows_new"], response.data["rows_duplicated"]), (0, 3))
        self.assertEqual(self.pending().count(), 3)

    def test_upload_c6_zip_with_password(self):
        content = zipcrypto_zip("fatura.csv", C6_CARD, "123456")

        missing = self.upload(content, "CARD_INVOICE", "f.zip")
        wrong = self.upload(content, "CARD_INVOICE", "f.zip", password="000000")
        ok = self.upload(content, "CARD_INVOICE", "f.zip", password="123456")

        self.assertEqual((missing.status_code, missing.data["detail"].code), (400, "password_required"))
        self.assertEqual(wrong.data["detail"].code, "wrong_password")
        self.assertEqual((ok.status_code, ok.data["rows_new"]), (201, 3))
        self.assertNotIn("123456", str(ok.data))

    def test_upload_errors_are_generic(self):
        unknown = self.upload(b"Dia;Quanto;Historico\n01/01/2026;10,00;Segredo\n")
        garbage = self.upload(b"\x00\x01\x02")
        pdf = self.upload(b"%PDF-1.7 Segredo")
        mismatch = self.upload(OFX, "CARD_INVOICE")

        self.assertEqual(unknown.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertEqual(unknown.data["headers"], ["Dia", "Quanto", "Historico"])
        self.assertEqual(garbage.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(pdf.status_code, status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)
        self.assertEqual(mismatch.status_code, status.HTTP_400_BAD_REQUEST)

        for response in (unknown, garbage, pdf, mismatch):
            self.assertNotIn("Segredo", str(response.data))

        self.assertEqual(ImportBatch.objects.count(), 0)

    def test_oversized_file_is_rejected_before_parsing(self):
        with override_settings(IMPORT_MAX_FILE_BYTES=50):
            response = self.upload(NUBANK_STATEMENT)

        self.assertEqual(response.status_code, status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
        self.assertEqual(ImportBatch.objects.count(), 0)

    def test_upload_with_saved_mapping_and_isolation(self):
        created = self.client.post(
            "/api/imports/csv-mappings/",
            {"name": "Banco X", "date_column": "Dia", "amount_column": "Quanto", "description_column": "Historico"},
        )
        content = b"Dia;Quanto;Historico\n01/01/2026;-10,00;Aluguel\n"

        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.upload(content, mapping=created.data["id"]).status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get("/api/imports/csv-mappings/").data, [])
        self.assertEqual(self.upload(content, mapping=created.data["id"]).status_code, status.HTTP_400_BAD_REQUEST)

    def test_mapping_validation(self):
        base = {"name": "X", "date_column": "A", "amount_column": "A", "description_column": "B"}

        self.assertEqual(self.client.post("/api/imports/csv-mappings/", base).status_code, 400)

    def test_upload_throttle(self):
        from unittest.mock import patch

        from rest_framework.throttling import ScopedRateThrottle

        with patch.object(ScopedRateThrottle, "THROTTLE_RATES", {"import_upload": "2/hour"}):
            codes = [self.upload().status_code for _ in range(3)]

        self.assertEqual(codes, [201, 201, status.HTTP_429_TOO_MANY_REQUESTS])

    # --- listagem e isolamento

    def test_list_defaults_to_pending_and_filters(self):
        self.upload()
        first = self.pending(direction="DEBIT", amount="45.90").get()
        first.status = PendingStatus.DISMISSED
        first.save(update_fields=["status"])

        default = self.client.get("/api/pending-transactions/")
        credits = self.client.get("/api/pending-transactions/?direction=CREDIT")
        dismissed = self.client.get("/api/pending-transactions/?status=DISMISSED")
        flagged = self.client.get("/api/pending-transactions/?flag=CARD_PAYMENT")

        self.assertEqual(len(default.data), 2)
        self.assertEqual(len(credits.data), 1)
        self.assertEqual([row["id"] for row in dismissed.data], [first.id])
        self.assertEqual(len(flagged.data), 1)

    def test_other_user_cannot_see_or_touch_anything(self):
        self.upload()
        pending = self.pending().first()
        batch = ImportBatch.objects.get()
        self.client.force_authenticate(self.other)
        payload = {"family": self.foreign_family.id, "category": self.category.id}

        self.assertEqual(self.client.get("/api/pending-transactions/").data, [])
        self.assertEqual(self.client.get(f"/api/pending-transactions/{pending.id}/").status_code, 404)
        self.assertEqual(self.client.post(f"/api/pending-transactions/{pending.id}/import/", payload).status_code, 404)
        self.assertEqual(self.client.post("/api/pending-transactions/bulk/", {"ids": [pending.id], "action": "dismiss"}).status_code, 404)
        self.assertEqual(self.client.get("/api/imports/").data, [])
        self.assertEqual(self.client.delete(f"/api/imports/{batch.id}/").status_code, 404)
        self.assertEqual(self.pending().count(), 3)

    def test_detail_flags_possible_duplicate(self):
        self.upload()
        debit = self.pending(direction="DEBIT", amount="45.90").get()
        Expense.objects.create(
            family=self.family, category=self.category, amount="45.90", date="2026-09-06",
            created_by=self.user, updated_by=self.user,
        )

        self.assertTrue(self.client.get(f"/api/pending-transactions/{debit.id}/").data["possible_duplicate"])

    # --- registrar

    def test_register_creates_expense_and_clears_pending(self):
        self.upload()
        debit = self.pending(direction="DEBIT", amount="45.90").get()

        response = self.client.post(
            f"/api/pending-transactions/{debit.id}/import/",
            {"family": self.family.id, "category": self.category.id, "amount": "46.00", "description": "Feira"},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        expense = Expense.objects.get()
        self.assertEqual((str(expense.amount), expense.description, str(expense.date)), ("46.00", "Feira", "2026-09-05"))
        self.assertEqual(expense.created_by, self.user)
        debit.refresh_from_db()
        self.assertEqual((debit.status, debit.description, debit.expense_id), (PendingStatus.IMPORTED, "", expense.id))
        self.assertEqual(self.client.post(f"/api/pending-transactions/{debit.id}/import/", {"family": self.family.id, "category": self.category.id}).status_code, 409)
        self.assertEqual(Expense.objects.count(), 1)

    def test_register_defaults_come_from_the_pending(self):
        self.upload()
        debit = self.pending(direction="DEBIT", amount="45.90").get()

        self.client.post(f"/api/pending-transactions/{debit.id}/import/", {"family": self.family.id, "category": self.category.id})

        self.assertEqual(Expense.objects.get().description, "Compra no débito - Mercado")

    def test_credit_cannot_be_registered(self):
        self.upload()
        credit = self.pending(direction="CREDIT").get()

        response = self.client.post(f"/api/pending-transactions/{credit.id}/import/", {"family": self.family.id, "category": self.category.id})

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(Expense.objects.count(), 0)

    def test_register_validates_family_and_category(self):
        self.upload()
        debit = self.pending(direction="DEBIT", amount="45.90").get()
        url = f"/api/pending-transactions/{debit.id}/import/"
        other_cat = FinancialCategory.objects.create(name="Só deles", type=CategoryType.EXPENSE, family=self.foreign_family)

        self.assertEqual(self.client.post(url, {"family": self.foreign_family.id, "category": self.category.id}).status_code, 400)
        self.assertEqual(self.client.post(url, {"family": self.family.id, "category": self.income_category.id}).status_code, 400)
        self.assertEqual(self.client.post(url, {"family": self.family.id, "category": other_cat.id}).status_code, 400)
        self.assertEqual(self.client.post(url, {"family": self.family.id, "category": self.category.id, "amount": "0"}).status_code, 400)
        self.assertEqual(Expense.objects.count(), 0)
        self.assertEqual(self.pending(status=PendingStatus.PENDING).count(), 3)

    # --- lote

    def test_bulk_import_and_dismiss(self):
        self.upload(NUBANK_STATEMENT)
        debits = list(self.pending(direction="DEBIT").values_list("id", flat=True))
        credit = self.pending(direction="CREDIT").get()

        bad = self.client.post("/api/pending-transactions/bulk/", {"ids": debits + [credit.id], "action": "import", "family": self.family.id, "category": self.category.id})
        no_target = self.client.post("/api/pending-transactions/bulk/", {"ids": debits, "action": "import"})
        ok = self.client.post("/api/pending-transactions/bulk/", {"ids": debits, "action": "import", "family": self.family.id, "category": self.category.id})
        dismissed = self.client.post("/api/pending-transactions/bulk/", {"ids": [credit.id], "action": "dismiss"})
        again = self.client.post("/api/pending-transactions/bulk/", {"ids": [credit.id], "action": "dismiss"})

        self.assertEqual(bad.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(no_target.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual((ok.status_code, ok.data), (200, {"processed": 2}))
        self.assertEqual(Expense.objects.count(), 2)
        self.assertEqual(dismissed.data, {"processed": 1})
        self.assertEqual(again.status_code, status.HTTP_409_CONFLICT)
        credit.refresh_from_db()
        self.assertEqual((credit.status, credit.description), (PendingStatus.DISMISSED, ""))

    def test_bulk_is_all_or_nothing_and_validates_ids(self):
        self.upload()
        ids = list(self.pending().values_list("id", flat=True))

        missing = self.client.post("/api/pending-transactions/bulk/", {"ids": ids + [999999], "action": "dismiss"})
        repeated = self.client.post("/api/pending-transactions/bulk/", {"ids": [ids[0], ids[0]], "action": "dismiss"})
        empty = self.client.post("/api/pending-transactions/bulk/", {"ids": [], "action": "dismiss"})

        self.assertEqual((missing.status_code, repeated.status_code, empty.status_code), (404, 400, 400))
        self.assertEqual(self.pending(status=PendingStatus.PENDING).count(), 3)

    # --- remover lote

    def test_delete_batch_keeps_registered_expenses_and_handled_rows(self):
        self.upload()
        batch = ImportBatch.objects.get()
        debit = self.pending(direction="DEBIT", amount="45.90").get()
        self.client.post(f"/api/pending-transactions/{debit.id}/import/", {"family": self.family.id, "category": self.category.id})

        listing = self.client.get("/api/imports/")
        response = self.client.delete(f"/api/imports/{batch.id}/")

        self.assertEqual(listing.data[0]["pending_count"], 2)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Expense.objects.count(), 1)
        self.assertEqual(list(self.pending().values_list("status", flat=True)), [PendingStatus.IMPORTED])
        self.assertEqual(self.upload().data["rows_new"], 2)

    def test_delete_batch_without_handled_rows_removes_it(self):
        self.upload()
        batch = ImportBatch.objects.get()

        self.assertEqual(self.client.delete(f"/api/imports/{batch.id}/").status_code, 204)
        self.assertFalse(ImportBatch.objects.exists())
        self.assertFalse(PendingTransaction.objects.exists())
