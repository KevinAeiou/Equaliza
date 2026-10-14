from datetime import date, timedelta
from decimal import Decimal

from django.core.exceptions import ImproperlyConfigured
from django.core.management import call_command
from django.db import connection
from django.test import TestCase, override_settings
from django.utils import timezone

from apps.imports.crypto import decrypt, encrypt
from apps.imports.enums import Direction, ImportFormat, ImportSource, PendingStatus
from apps.imports.models import PendingTransaction
from apps.imports.services import (
    CreateImportBatchService,
    ParsedRow,
    PurgePendingService,
    ResolvePendingService,
    UploadRejected,
    validate_upload,
)
from apps.users.models import User


def make_row(description="Mercado", amount="10.00", day=1, external_id="", **extra):
    return ParsedRow(
        direction=Direction.DEBIT,
        amount=Decimal(amount),
        occurred_at=date(2026, 9, day),
        description=description,
        external_id=external_id,
        account_ref="1234",
        **extra,
    )


class ImportsBaseTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="a@example.com", password="x", first_name="A")
        self.other = User.objects.create_user(email="b@example.com", password="x", first_name="B")

    def run_import(self, rows, owner=None, content=b"conteudo"):
        return CreateImportBatchService.execute(
            owner or self.user, ImportSource.STATEMENT, ImportFormat.OFX, content, rows
        )

    def test_description_is_encrypted_at_rest(self):
        self.run_import([make_row("Pix Fulano de Tal", counterparty="Fulano")])

        with connection.cursor() as cursor:
            cursor.execute("SELECT description, counterparty FROM imports_pendingtransaction")
            raw = cursor.fetchone()

        self.assertNotIn("Fulano", "".join(raw))
        self.assertEqual(PendingTransaction.objects.get().description, "Pix Fulano de Tal")
        self.assertEqual(decrypt(encrypt("ação")), "ação")

    def test_missing_key_fails_loudly(self):
        with override_settings(IMPORT_ENCRYPTION_KEYS=[]):
            with self.assertRaises(ImproperlyConfigured):
                encrypt("x")

    def test_resending_same_file_does_not_duplicate(self):
        rows = [make_row("A", external_id="1"), make_row("B", external_id="2")]

        first = self.run_import(rows)
        second = self.run_import(rows)

        self.assertEqual((first.rows_new, first.rows_duplicated), (2, 0))
        self.assertEqual((second.rows_new, second.rows_duplicated), (0, 2))
        self.assertEqual(PendingTransaction.objects.count(), 2)

    def test_overlapping_files_only_add_new_rows(self):
        self.run_import([make_row("A", day=1), make_row("B", day=2)])

        batch = self.run_import([make_row("B", day=2), make_row("C", day=3)])

        self.assertEqual((batch.rows_new, batch.rows_duplicated), (1, 1))

    def test_identical_lines_in_same_day_are_kept_and_stable(self):
        rows = [make_row("Café", "5.00"), make_row("Café", "5.00")]

        self.run_import(rows)
        again = self.run_import(rows)

        self.assertEqual(PendingTransaction.objects.count(), 2)
        self.assertEqual(again.rows_new, 0)

    def test_same_line_is_independent_per_owner(self):
        self.run_import([make_row("A", external_id="1")])
        batch = self.run_import([make_row("A", external_id="1")], owner=self.other)

        self.assertEqual(batch.rows_new, 1)

    def test_amount_is_stored_positive_with_period(self):
        batch = self.run_import([make_row("A", "-7.50", day=5), make_row("B", day=9)])

        self.assertEqual(PendingTransaction.objects.get(occurred_at=date(2026, 9, 5)).amount, Decimal("7.50"))
        self.assertEqual((batch.period_start, batch.period_end), (date(2026, 9, 5), date(2026, 9, 9)))

    def test_limits(self):
        with override_settings(IMPORT_MAX_FILE_BYTES=10):
            with self.assertRaises(UploadRejected):
                validate_upload(b"x" * 11)

        with self.assertRaises(UploadRejected):
            validate_upload(b"")

        with override_settings(IMPORT_MAX_ROWS=1):
            with self.assertRaises(UploadRejected):
                self.run_import([make_row("A"), make_row("B")])

        self.assertEqual(PendingTransaction.objects.count(), 0)

    def test_dismiss_erases_data_and_ignores_other_owners(self):
        self.run_import([make_row("A", counterparty="Fulano")])
        pending = PendingTransaction.objects.get()

        self.assertEqual(ResolvePendingService.dismiss(self.other, [pending.pk]), 0)
        self.assertEqual(ResolvePendingService.dismiss(self.user, [pending.pk]), 1)

        pending.refresh_from_db()
        self.assertEqual(pending.status, PendingStatus.DISMISSED)
        self.assertEqual((pending.description, pending.counterparty), ("", ""))

    def test_dismissed_row_does_not_come_back_on_reupload(self):
        rows = [make_row("A", external_id="1")]
        self.run_import(rows)
        ResolvePendingService.dismiss(self.user, [PendingTransaction.objects.get().pk])

        batch = self.run_import(rows)

        self.assertEqual(batch.rows_new, 0)

    def test_purge_expires_old_rows_and_erases_data(self):
        self.run_import([make_row("A", day=1), make_row("B", day=2)])
        old = PendingTransaction.objects.get(occurred_at=date(2026, 9, 1))
        PendingTransaction.objects.filter(pk=old.pk).update(
            expires_at=timezone.now() - timedelta(days=1)
        )

        expired, _ = PurgePendingService.execute()
        old.refresh_from_db()

        self.assertEqual(expired, 1)
        self.assertEqual((old.status, old.description), (PendingStatus.EXPIRED, ""))
        self.assertEqual(PendingTransaction.objects.get(occurred_at=date(2026, 9, 2)).status, PendingStatus.PENDING)

    def test_purge_command_runs(self):
        call_command("purge_pending_imports", verbosity=0)
