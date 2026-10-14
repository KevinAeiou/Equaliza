import io
import zipfile
from datetime import timedelta
from unittest.mock import patch

from django.core.cache import cache
from django.core.files.uploadedfile import InMemoryUploadedFile, SimpleUploadedFile
from django.core.files.uploadhandler import StopFutureHandlers, StopUpload
from django.core.management import call_command
from django.db import connection
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.families.enums import FamilyRole
from apps.families.models import Family, FamilyMember
from apps.finance.enums import CategoryType
from apps.finance.models import FinancialCategory
from apps.imports.models import CsvMapping, ImportBatch, PendingTransaction
from apps.imports.services import UploadImportService
from apps.imports.tests.helpers import zipcrypto_zip
from apps.imports.tests.test_csv_parser import C6_CARD
from apps.imports.upload import LimitedMemoryUploadHandler
from apps.users.models import User

SECRET_TEXT = "Pix Segredo da Silva"
SECRET_FILENAME = "extrato-cpf-12345678900.csv"
PASSWORD = "senha-secreta-42"

STATEMENT = (
    "Data,Valor,Identificador,Descrição\n"
    f"05/09/2026,-45.90,id-1,{SECRET_TEXT}\n"
    "10/09/2026,3000.00,id-2,Salário Empresa X\n"
).encode()

XXE_OFX = b"""<?xml version="1.0"?>
<!DOCTYPE OFX [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<OFX><BANKMSGSRSV1><STMTTRN><DTPOSTED>20260801</DTPOSTED><TRNAMT>-1.00</TRNAMT>
<FITID>1</FITID><MEMO>&xxe;</MEMO></STMTTRN></BANKMSGSRSV1></OFX>"""


@override_settings(STATEMENT_IMPORT_ENABLED=True)
class ImportSecurityTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(email="a@example.com", password="x", first_name="A")
        self.other = User.objects.create_user(email="b@example.com", password="x", first_name="B")
        self.family = Family.objects.create(name="Casa")
        FamilyMember.objects.create(family=self.family, user=self.user, role=FamilyRole.OWNER)
        self.user.current_family = self.family
        self.user.save(update_fields=["current_family"])
        self.category = FinancialCategory.objects.create(name="Mercado", type=CategoryType.EXPENSE)
        self.client.force_authenticate(self.user)

    def upload(self, content=STATEMENT, source="STATEMENT", name=SECRET_FILENAME, **extra):
        return self.client.post(
            "/api/imports/",
            {"file": SimpleUploadedFile(name, content), "source": source, **extra},
            format="multipart",
        )

    def raw_dump(self):
        """Tudo o que está gravado nas tabelas da importação, como o banco enxerga."""
        parts = []

        with connection.cursor() as cursor:
            for table in ("imports_importbatch", "imports_pendingtransaction", "imports_csvmapping"):
                cursor.execute(f"SELECT * FROM {table}")
                parts.extend(str(row) for row in cursor.fetchall())

        return "\n".join(parts)

    # --- o arquivo nunca é guardado

    def test_upload_stays_in_memory_even_when_django_would_use_a_temp_file(self):
        seen = []
        real = UploadImportService.execute.__func__

        def spy(cls, owner, uploaded_file, *args, **kwargs):
            seen.append(uploaded_file)
            return real(cls, owner, uploaded_file, *args, **kwargs)

        with override_settings(FILE_UPLOAD_MAX_MEMORY_SIZE=1):
            with patch.object(UploadImportService, "execute", classmethod(spy)):
                response = self.upload()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsInstance(seen[0], InMemoryUploadedFile)

    def test_files_above_djangos_memory_threshold_still_upload(self):
        # Regressão: acima de FILE_UPLOAD_MAX_MEMORY_SIZE (2,5 MB) o handler padrão deixava o arquivo sem handler.
        head = "Data,Valor,Identificador,Descrição\n"
        body = head + "".join(f"05/09/2026,-1.00,id-{i},{'x' * 40}\n" for i in range(55_000))

        with override_settings(IMPORT_MAX_ROWS=100_000):
            response = self.upload(body.encode())

        self.assertGreater(len(body), 2_621_440)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["rows_total"], 55_000)

    def test_file_name_and_content_are_not_stored(self):
        self.upload()
        dump = self.raw_dump()

        self.assertNotIn("12345678900", dump)
        self.assertNotIn("extrato", dump)
        self.assertNotIn(SECRET_TEXT, dump)

    def test_upload_handler_cuts_oversized_chunked_uploads(self):
        handler = LimitedMemoryUploadHandler(request=None)
        handler.handle_raw_input(io.BytesIO(), {}, 100, b"x")
        with self.assertRaises(StopFutureHandlers):  # sinal normal do Django: este handler fica com o arquivo
            handler.new_file("file", "a.csv", "text/csv", 100)

        with override_settings(IMPORT_MAX_FILE_BYTES=10):
            handler.receive_data_chunk(b"x" * 5, 0)

            with self.assertRaises(StopUpload):
                handler.receive_data_chunk(b"x" * 70_000, 5)

    def test_huge_content_length_is_refused_before_reading_the_body(self):
        response = self.client.generic(
            "POST",
            "/api/imports/",
            b"x",
            content_type="multipart/form-data; boundary=x",
            CONTENT_LENGTH=str(50 * 1024 * 1024),
        )

        self.assertEqual(response.status_code, status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
        self.assertFalse(ImportBatch.objects.exists())

    # --- arquivos maliciosos

    def test_xxe_is_never_resolved(self):
        response = self.upload(XXE_OFX, name="x.ofx")
        pending = PendingTransaction.objects.first()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(pending.description, "&xxe;")
        self.assertNotIn("root:", self.client.get("/api/pending-transactions/").content.decode())

    def test_compression_bomb_is_rejected_without_creating_anything(self):
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
            archive.writestr("bomba.csv", b"0" * 3_000_000)

        response = self.upload(buffer.getvalue(), name="bomba.zip")

        self.assertGreaterEqual(response.status_code, 400)
        self.assertFalse(ImportBatch.objects.exists())

    def test_row_limit_is_enforced(self):
        lines = "".join(f"01/09/2026,-1.{i % 100:02d},id-{i},Linha {i}\n" for i in range(30))

        with override_settings(IMPORT_MAX_ROWS=10):
            response = self.upload(("Data,Valor,Identificador,Descrição\n" + lines).encode())

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(PendingTransaction.objects.exists())

    def test_hostile_text_is_stored_and_returned_as_plain_text(self):
        payload = '<script>alert(1)</script>=HYPERLINK("http://evil")'
        content = f"Data,Valor,Identificador,Descrição\n05/09/2026,-1.00,id-1,\"{payload.replace(chr(34), chr(34) * 2)}\"\n".encode()

        self.upload(content)
        response = self.client.get("/api/pending-transactions/")

        self.assertEqual(response["Content-Type"], "application/json")
        self.assertEqual(response.data[0]["description"], payload)

    def test_binary_and_pdf_are_rejected_without_echoing_content(self):
        for content in (b"\x00\x01\x02Segredo", b"%PDF-1.7 Segredo", b"MZ\x90\x00Segredo"):
            response = self.upload(content)

            self.assertGreaterEqual(response.status_code, 400)
            self.assertNotIn("Segredo", str(response.data))

    # --- dados sensíveis em repouso e em log

    def test_sensitive_fields_are_encrypted_then_erased(self):
        self.upload()
        self.assertNotIn(SECRET_TEXT, self.raw_dump())
        self.assertNotIn("Salário Empresa X", self.raw_dump())

        debit = PendingTransaction.objects.get(occurred_at="2026-09-05")
        self.client.post(
            f"/api/pending-transactions/{debit.id}/import/", {"family": self.family.id, "category": self.category.id}
        )
        credit = PendingTransaction.objects.get(occurred_at="2026-09-10")
        self.client.post("/api/pending-transactions/bulk/", {"ids": [credit.id], "action": "dismiss"})

        with connection.cursor() as cursor:
            cursor.execute("SELECT description, counterparty FROM imports_pendingtransaction")
            self.assertEqual({tuple(row) for row in cursor.fetchall()}, {("", "")})

    def test_api_never_exposes_internal_hashes_or_the_owner(self):
        self.upload()
        item = self.client.get("/api/pending-transactions/").data[0]
        batch = self.client.get("/api/imports/").data[0]

        for key in ("external_id_hash", "owner", "file_hash"):
            self.assertNotIn(key, item)
            self.assertNotIn(key, batch)

    def test_logs_never_contain_file_data_or_passwords(self):
        zipped = zipcrypto_zip("fatura.csv", C6_CARD, PASSWORD)

        with self.assertLogs(level="DEBUG") as captured:
            self.upload()
            self.upload(zipped, "CARD_INVOICE", "f.zip")
            self.upload(zipped, "CARD_INVOICE", "f.zip", password="errada-123")
            self.upload(zipped, "CARD_INVOICE", "f.zip", password=PASSWORD)
            self.upload(b"\x00lixo")
            self.upload(b"Dia;Quanto\n1;2\n")
            pending = PendingTransaction.objects.first()
            self.client.post(
                f"/api/pending-transactions/{pending.id}/import/",
                {"family": self.family.id, "category": self.category.id},
            )
            self.client.post("/api/pending-transactions/bulk/", {"ids": [999999], "action": "dismiss"})
            call_command("purge_pending_imports", verbosity=0)

        text = "\n".join(record.getMessage() for record in captured.records)

        for forbidden in (SECRET_TEXT, SECRET_FILENAME, PASSWORD, "errada-123", "MERCADO CENTRAL", "45.90", "FULANO"):
            self.assertNotIn(forbidden, text)

        self.assertIn("Importação concluída", text)

    def test_passwords_are_not_persisted(self):
        zipped = zipcrypto_zip("fatura.csv", C6_CARD, PASSWORD)

        self.upload(zipped, "CARD_INVOICE", "f.zip", password=PASSWORD)

        self.assertNotIn(PASSWORD, self.raw_dump())

    # --- retenção e exclusão

    def test_expired_rows_disappear_from_the_api_and_lose_their_data(self):
        self.upload()
        PendingTransaction.objects.update(expires_at=timezone.now() - timedelta(days=1))

        call_command("purge_pending_imports", verbosity=0)

        self.assertEqual(self.client.get("/api/pending-transactions/").data, [])
        self.assertNotIn(SECRET_TEXT, self.raw_dump())
        self.assertEqual(self.upload().data["rows_new"], 0)

    def test_deleting_the_account_removes_everything(self):
        self.upload()
        CsvMapping.objects.create(
            owner=self.user, name="X", date_column="a", amount_column="b", description_column="c"
        )

        self.user.delete()

        self.assertFalse(ImportBatch.objects.exists())
        self.assertFalse(PendingTransaction.objects.exists())
        self.assertFalse(CsvMapping.objects.exists())

    # --- autorização

    def test_other_users_cannot_touch_mappings_or_batches(self):
        mapping = CsvMapping.objects.create(
            owner=self.user, name="X", date_column="a", amount_column="b", description_column="c"
        )
        self.upload()
        batch = ImportBatch.objects.get()
        self.client.force_authenticate(self.other)

        self.assertEqual(self.client.delete(f"/api/imports/csv-mappings/{mapping.id}/").status_code, 404)
        self.assertEqual(self.client.get(f"/api/imports/{batch.id}/").status_code, 404)
        self.assertEqual(self.client.delete(f"/api/imports/{batch.id}/").status_code, 404)
        self.assertTrue(CsvMapping.objects.filter(pk=mapping.pk).exists())
        self.assertTrue(ImportBatch.objects.filter(pk=batch.pk).exists())

    def test_cannot_register_into_a_family_the_user_does_not_belong_to(self):
        foreign = Family.objects.create(name="Outra")
        FamilyMember.objects.create(family=foreign, user=self.other, role=FamilyRole.OWNER)
        self.upload()
        pending = PendingTransaction.objects.get(occurred_at="2026-09-05")

        response = self.client.post(
            f"/api/pending-transactions/{pending.id}/import/", {"family": foreign.id, "category": self.category.id}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inactive_membership_cannot_receive_expenses(self):
        FamilyMember.objects.filter(family=self.family, user=self.user).update(is_active=False)
        self.upload()
        pending = PendingTransaction.objects.get(occurred_at="2026-09-05")

        response = self.client.post(
            f"/api/pending-transactions/{pending.id}/import/", {"family": self.family.id, "category": self.category.id}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_every_route_requires_authentication(self):
        self.client.force_authenticate(None)
        pending_url = "/api/pending-transactions/1/"

        for method, url in (
            ("get", "/api/imports/"),
            ("post", "/api/imports/"),
            ("delete", "/api/imports/1/"),
            ("get", "/api/imports/csv-mappings/"),
            ("get", "/api/pending-transactions/"),
            ("get", pending_url),
            ("post", pending_url + "import/"),
            ("post", "/api/pending-transactions/bulk/"),
        ):
            self.assertEqual(getattr(self.client, method)(url).status_code, 401, (method, url))
