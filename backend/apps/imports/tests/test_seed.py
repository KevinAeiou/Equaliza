from django.core.management import call_command
from django.test import TestCase, override_settings

from apps.imports.enums import Direction, PendingFlag, PendingStatus
from apps.imports.models import ImportBatch, PendingTransaction
from apps.users.models import User


class SeedDemoPendingTests(TestCase):
    def test_seed_creates_a_statement_and_an_invoice_for_ana(self):
        call_command("seed_demo", force=True, verbosity=0)
        ana = User.objects.get(email="ana@equaliza.dev")

        rows = PendingTransaction.objects.filter(owner=ana)

        self.assertEqual(ImportBatch.objects.filter(owner=ana).count(), 2)
        self.assertEqual(rows.count(), 9)
        self.assertTrue(all(row.status == PendingStatus.PENDING for row in rows))
        self.assertTrue(rows.filter(direction=Direction.CREDIT).exists())
        self.assertEqual(rows.filter(flag=PendingFlag.CARD_PAYMENT).count(), 1)
        self.assertEqual(PendingTransaction.objects.exclude(owner=ana).count(), 0)

    def test_seed_twice_recreates_without_duplicating(self):
        call_command("seed_demo", force=True, verbosity=0)
        call_command("seed_demo", force=True, verbosity=0)

        self.assertEqual(PendingTransaction.objects.count(), 9)
        self.assertEqual(ImportBatch.objects.count(), 2)

    @override_settings(IMPORT_ENCRYPTION_KEYS=[])
    def test_seed_without_encryption_key_skips_pending_and_still_works(self):
        call_command("seed_demo", force=True, verbosity=0)

        self.assertFalse(PendingTransaction.objects.exists())
        self.assertTrue(User.objects.filter(email="ana@equaliza.dev").exists())
