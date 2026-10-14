import io
from decimal import Decimal

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.imports.enums import PendingFlag
from apps.imports.models import ImportBatch, PendingTransaction
from apps.imports.parsers import ParseError, PasswordRequired, WrongPassword
from apps.imports.parsers.pdf import extract_pdf_text, is_pdf
from apps.imports.tests import c6_samples
from apps.users.models import User


def build_pdf(text, password=None):
    from reportlab.lib.pdfencrypt import StandardEncryption
    from reportlab.pdfgen import canvas

    buffer = io.BytesIO()
    encrypt = StandardEncryption(password, strength=128) if password else None
    pdf = canvas.Canvas(buffer, encrypt=encrypt) if encrypt else canvas.Canvas(buffer)
    pdf.setFont("Helvetica", 8)
    y = 820

    for line in text.splitlines():
        pdf.drawString(30, y, line)
        y -= 11

        if y < 30:
            pdf.showPage()
            pdf.setFont("Helvetica", 8)
            y = 820

    pdf.save()

    return buffer.getvalue()


class PdfExtractionTests(APITestCase):
    def test_extracts_text_and_handles_passwords(self):
        locked = build_pdf("05/10 05/10 Pagamento TESTE -R$ 1,00", password="1234")

        self.assertTrue(is_pdf(locked))
        self.assertIn("TESTE", extract_pdf_text(locked, "1234"))

        with self.assertRaises(PasswordRequired):
            extract_pdf_text(locked)

        with self.assertRaises(WrongPassword):
            extract_pdf_text(locked, "0000")

    def test_broken_and_hostile_pdfs_fail_generically(self):
        for content in (b"%PDF-1.4\n1 0 obj <</Type/Catalog>> endobj", b"%PDF-" + b"\x00" * 50, b"%PDF-1.7 Segredo"):
            with self.assertRaises(ParseError) as ctx:
                extract_pdf_text(content)

            self.assertNotIn("Segredo", str(ctx.exception))

    def test_page_limit(self):
        pdf = build_pdf("\n".join(f"linha {i}" for i in range(400)))

        with override_settings(IMPORT_PDF_MAX_PAGES=1):
            with self.assertRaises(ParseError):
                extract_pdf_text(pdf)

    def test_worker_does_not_inherit_the_server_environment(self):
        import os
        import subprocess
        import sys

        from apps.imports.parsers.pdf import WORKER

        os.environ["IMPORT_ENCRYPTION_KEYS_TEST_PROBE"] = "valor-secreto"

        try:
            done = subprocess.run(
                [sys.executable, "-I", "-c", "import os,sys; sys.stdout.write(str(sorted(os.environ)))"],
                capture_output=True, env={}, cwd="/",
            )
        finally:
            del os.environ["IMPORT_ENCRYPTION_KEYS_TEST_PROBE"]

        self.assertNotIn("IMPORT_ENCRYPTION_KEYS_TEST_PROBE", done.stdout.decode())
        self.assertTrue(WORKER.exists())


@override_settings(STATEMENT_IMPORT_ENABLED=True)
class PdfStatementApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(email="a@example.com", password="x", first_name="A")
        self.other = User.objects.create_user(email="b@example.com", password="x", first_name="B")
        self.client.force_authenticate(self.user)
        self.pdf = build_pdf(c6_samples.as_lines())

    def preview(self, content=None, **extra):
        return self.client.post(
            "/api/imports/preview/",
            {"file": SimpleUploadedFile("extrato.pdf", content or self.pdf), **extra},
            format="multipart",
        )

    def confirm(self, rows, **extra):
        return self.client.post("/api/imports/confirm/", {"rows": rows, **extra}, format="json")

    def test_preview_returns_rows_and_matching_totals_without_saving(self):
        response = self.preview()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["rows"]), 6)
        self.assertTrue(response.data["matches"])
        self.assertEqual(Decimal(response.data["parsed_in"]), c6_samples.EXPECTED_IN)
        self.assertEqual(response.data["account_ref"], "2222")
        self.assertEqual(response.data["rows"][0]["kind"], "Outros gastos")
        self.assertFalse(ImportBatch.objects.exists())
        self.assertFalse(PendingTransaction.objects.exists())

    def test_preview_flags_a_total_that_does_not_match(self):
        pdf = build_pdf(c6_samples.as_lines().replace("R$ 3.000,00", "R$ 2.000,00"))

        self.assertFalse(self.preview(pdf).data["matches"])

    def test_preview_with_password_errors(self):
        locked = build_pdf(c6_samples.as_lines(), password="123456")

        missing = self.preview(locked)
        wrong = self.preview(locked, password="000000")
        ok = self.preview(locked, password="123456")

        self.assertEqual((missing.status_code, missing.data["code"]), (400, "password_required"))
        self.assertEqual(wrong.data["code"], "wrong_password")
        self.assertEqual(ok.status_code, status.HTTP_200_OK)
        self.assertNotIn("123456", str(ok.data))

    def test_preview_rejects_non_c6_and_garbage_without_echoing(self):
        for content in (build_pdf("Fatura de outro banco Segredo 05/10 10,00"), b"%PDF-1.4 Segredo", b"nao e pdf Segredo"):
            response = self.preview(content)

            self.assertGreaterEqual(response.status_code, 400)
            self.assertNotIn("Segredo", str(response.data))

    def test_confirm_creates_pending_rows_and_is_idempotent(self):
        rows = self.preview().data["rows"]

        first = self.confirm(rows, account_ref="2222")
        again = self.confirm(rows, account_ref="2222")

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual((first.data["rows_new"], first.data["format"]), (6, "PDF"))
        self.assertEqual((again.data["rows_new"], again.data["rows_duplicated"]), (0, 6))
        self.assertEqual(PendingTransaction.objects.count(), 6)
        self.assertEqual(PendingTransaction.objects.filter(flag=PendingFlag.CARD_PAYMENT).count(), 1)

    def test_confirm_accepts_the_users_edits_and_recomputes_flags(self):
        rows = self.preview().data["rows"]
        rows[0]["description"] = "IOF editado pelo usuário"
        rows[1]["description"] = "PGTO FAT CARTAO X"

        self.confirm(rows)
        flagged = PendingTransaction.objects.filter(flag=PendingFlag.CARD_PAYMENT)

        self.assertEqual(flagged.count(), 2)
        self.assertTrue(any(item.description == "IOF editado pelo usuário" for item in PendingTransaction.objects.all()))

    def test_confirm_validates_rows(self):
        good = {"date": "2026-10-02", "description": "A", "amount": "1.00", "direction": "DEBIT"}

        for bad in (
            [],
            [{**good, "amount": "0"}],
            [{**good, "amount": "-5.00"}],
            [{**good, "direction": "SIDEWAYS"}],
            [{**good, "date": "2026-13-45"}],
            [{**good, "description": "x" * 501}],
        ):
            self.assertEqual(self.confirm(bad).status_code, status.HTTP_400_BAD_REQUEST, bad)

        self.assertEqual(self.confirm([good], account_ref="12345").status_code, status.HTTP_400_BAD_REQUEST)

        with override_settings(IMPORT_MAX_ROWS=1):
            self.assertEqual(self.confirm([good, {**good, "description": "B"}]).status_code, 400)

        self.assertFalse(PendingTransaction.objects.exists())

    def test_confirmed_rows_belong_to_the_user_only(self):
        self.confirm(self.preview().data["rows"])
        self.client.force_authenticate(self.other)

        self.assertEqual(self.client.get("/api/pending-transactions/").data, [])

    def test_routes_require_authentication_and_the_flag(self):
        self.client.force_authenticate(None)

        self.assertEqual(self.preview().status_code, 401)
        self.assertEqual(self.confirm([]).status_code, 401)

        self.client.force_authenticate(self.user)

        with override_settings(STATEMENT_IMPORT_ENABLED=False):
            self.assertEqual(self.preview().status_code, 404)
            self.assertEqual(self.confirm([]).status_code, 404)

    def test_regular_upload_of_a_pdf_points_to_the_review_flow(self):
        response = self.client.post(
            "/api/imports/", {"file": SimpleUploadedFile("e.pdf", self.pdf), "source": "STATEMENT"}, format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)
        self.assertIn("revisão", response.data["detail"])
