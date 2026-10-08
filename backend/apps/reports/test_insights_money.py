from datetime import date
from decimal import Decimal

from django.test import SimpleTestCase

from apps.reports.insights import MONTH, Entry, build_insights, format_currency


def report(amount, income):
    entries = [
        Entry(date(2026, 10, 5), 1, "Moradia", "Moradia", amount),
        Entry(date(2026, 10, 6), 2, "Lazer", "Lazer", amount / 10),
    ]

    return build_insights(MONTH, date(2026, 10, 1), date(2026, 10, 31), entries, [], date(2026, 11, 20), income=income)


class InsightsMoneyTests(SimpleTestCase):
    def test_currency_rounds_half_up(self):
        self.assertEqual(format_currency(Decimal("2.675")), "R$ 2,68")
        self.assertEqual(format_currency(Decimal("2.665")), "R$ 2,67")
        self.assertEqual(format_currency(Decimal("-1234.5")), "-R$ 1.234,50")

    def test_currency_accepts_int_and_float(self):
        self.assertEqual(format_currency(1500), "R$ 1.500,00")
        self.assertEqual(format_currency(0.1 + 0.2), "R$ 0,30")

    def test_decimal_and_float_inputs_give_the_same_report(self):
        with_decimal = report(Decimal("1000.00"), Decimal("5000.00"))
        with_float = report(1000.0, 5000.0)

        self.assertEqual(with_decimal, with_float)
