from datetime import date
from decimal import Decimal

from django.db import IntegrityError, transaction
from django.test import TestCase
from django.utils import timezone

from apps.families.models import Family
from apps.settlements.models import Settlement
from apps.users.models import User


class SettlementModelTests(TestCase):
    def setUp(self):
        self.ana = User.objects.create_user(email="ana@example.com", password="x")
        self.bia = User.objects.create_user(email="bia@example.com", password="x")
        self.family = Family.objects.create(name="Casa")

    def make(self, **overrides):
        data = dict(
            family=self.family,
            payer=self.ana,
            receiver=self.bia,
            amount=Decimal("10.00"),
            reference_month=date(2026, 10, 1),
        )
        data.update(overrides)
        return Settlement.objects.create(**data)

    def test_defaults(self):
        settlement = self.make()

        self.assertEqual(settlement.status, "ACTIVE")
        self.assertEqual(settlement.paid_at, timezone.localdate())

    def test_payer_must_differ_from_receiver(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            self.make(receiver=self.ana)

    def test_amount_must_be_positive(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            self.make(amount=Decimal("0.00"))

    def test_new_family_starts_settling_in_current_month(self):
        self.assertEqual(self.family.settlement_start, timezone.localdate().replace(day=1))
