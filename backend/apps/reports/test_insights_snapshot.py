"""Congela o relatório completo de insights em cenários que disparam todos os tipos.

Protege refatorações de apps/reports/insights: qualquer mudança de texto, tom, ordem ou
valor aparece como diferença no snapshot. Para regenerar de propósito:
`UPDATE_SNAPSHOT=1 python manage.py test apps.reports.test_insights_snapshot`.
"""

import json
import os
from datetime import date
from decimal import Decimal
from pathlib import Path

from django.test import SimpleTestCase

from apps.finance.enums import RecurrenceFrequency
from apps.reports.insights import DAY, MONTH, PERIOD, WEEK, YEAR, Entry, Recurring, build_insights

SNAPSHOT = Path(__file__).with_name("insights_snapshot.json")

ALL_KINDS = {
    "above_average", "below_average", "drop", "rise", "total_change", "largest_expense",
    "trend", "concentration", "savings", "projection", "weekday", "upcoming",
}

_CATEGORY_IDS = {}


def e(category, amount, when, title=None):
    category_id = _CATEGORY_IDS.setdefault(category, len(_CATEGORY_IDS) + 1)

    return Entry(when, category_id, category, title or category, amount)


def monthly(per_month, months=6, first=date(2026, 10, 1)):
    """Um lançamento por categoria em cada um dos `months` meses anteriores a `first`."""
    entries = []

    for i in range(1, months + 1):
        index = first.year * 12 + first.month - 1 - i
        entries += [e(name, amount, date(index // 12, index % 12 + 1, 10)) for name, amount in per_month.items()]

    return entries


def october(current, past, today=date(2026, 11, 20), **kwargs):
    return build_insights(MONTH, date(2026, 10, 1), date(2026, 10, 31), current, past, today, **kwargs)


def rent():
    return [
        Recurring(1, "Aluguel", 1500, RecurrenceFrequency.MONTHLY, date(2026, 1, 25), None, 9),
        Recurring(2, "Seguro", 20.5, RecurrenceFrequency.MONTHLY, date(2026, 1, 28), None, 9),
        Recurring(3, "Curso", 90, RecurrenceFrequency.WEEKLY, date(2026, 9, 1), date(2026, 10, 20), 6),
    ]


def scenarios():
    saturdays = [date(2026, 10, day) for day in (3, 10, 17, 24, 31)]

    yield "empty", october([], monthly({"Moradia": 2000}))
    yield "no_history", october(
        [e("Moradia", 1800, date(2026, 10, 5)), e("Mercado", 300, date(2026, 10, 6)), e("Lazer", 100, date(2026, 10, 7))], []
    )
    yield "above_and_below_average", october(
        [e("Moradia", 2760, date(2026, 10, 5)), e("Lazer", 150, date(2026, 10, 8)), e("Mercado", 800, date(2026, 10, 9))],
        monthly({"Moradia": 2000, "Lazer": 300, "Mercado": 800}),
    )
    yield "above_ongoing", october(
        [e("Moradia", 2100, date(2026, 10, 5)), e("Lazer", 40, date(2026, 10, 8))],
        monthly({"Moradia": 1700, "Lazer": 300}),
        today=date(2026, 10, 15),
    )
    yield "margin_until_average", october([e("Lazer", 120, date(2026, 10, 3))], monthly({"Lazer": 310}), today=date(2026, 10, 15))
    yield "drop", october(
        [e("Transporte", 328, date(2026, 10, 5))],
        [*[x for x in monthly({"Transporte": 410}, months=5) if x.date.month != 9], e("Transporte", 420, date(2026, 9, 10))],
    )
    yield "vanished_category", october(
        [e("Mercado", 500, date(2026, 10, 5))],
        [e("Mercado", 500, date(2026, 9, 5)), e("Lazer", 260, date(2026, 9, 6)), e("Mercado", 480, date(2026, 8, 5))],
    )
    yield "rise_and_total_change", october(
        [e("Mercado", 1500, date(2026, 10, 5)), e("Lazer", 150, date(2026, 10, 6)), e("Moradia", 2000, date(2026, 10, 7))],
        [e("Mercado", 900, date(2026, 9, 5)), e("Lazer", 140, date(2026, 9, 6)), e("Moradia", 2000, date(2026, 9, 7))],
    )
    yield "total_drop", october(
        [e("Mercado", 600, date(2026, 10, 5)), e("Moradia", 1500, date(2026, 10, 7))],
        [e("Mercado", 900, date(2026, 9, 5)), e("Moradia", 2000, date(2026, 9, 7))],
    )
    yield "same_point_ongoing", october(
        [e("Mercado", 100, date(2026, 10, 2))],
        [*monthly({"Mercado": 100}), e("Mercado", 900, date(2026, 9, 25))],
        today=date(2026, 10, 10),
    )
    yield "trend", october(
        [e("Mercado", 1500, date(2026, 10, 5)), e("Lazer", 150, date(2026, 10, 6))],
        [
            e("Mercado", 1000, date(2026, 7, 10)), e("Mercado", 1050, date(2026, 8, 10)), e("Mercado", 1200, date(2026, 9, 10)),
            e("Lazer", 100, date(2026, 7, 12)), e("Lazer", 110, date(2026, 8, 12)), e("Lazer", 130, date(2026, 9, 12)),
        ],
    )
    yield "largest_and_concentration", october(
        [e("Moradia", 1800, date(2026, 10, 5), "Aluguel de outubro"), e("Mercado", 300, date(2026, 10, 6)), e("Lazer", 100, date(2026, 10, 7))],
        [],
    )
    yield "savings_alert", october([e("Moradia", 3000, date(2026, 10, 5))], [], income=2500.0)
    yield "savings_warning", october([e("Moradia", 2300, date(2026, 10, 5))], [], income=2500.0)
    yield "savings_good", october([e("Moradia", 1000, date(2026, 10, 5))], [], income=5000.0)
    yield "projection", october([e("Mercado", 1000, date(2026, 10, 3))], monthly({"Mercado": 1500}), today=date(2026, 10, 10))
    yield "projection_below", october([e("Mercado", 400, date(2026, 10, 3))], monthly({"Mercado": 1500}), today=date(2026, 10, 10))
    yield "weekday", october(
        [*(e("Lazer", 200, d) for d in saturdays), *(e("Mercado", 20, date(2026, 10, d)) for d in (5, 6, 7))], []
    )
    yield "upcoming", october([e("Mercado", 400, date(2026, 10, 3))], [], today=date(2026, 10, 10), recurring=rent())
    yield "everything", october(
        [
            e("Moradia", 2760, date(2026, 10, 5), "Aluguel"), e("Mercado", 1500, date(2026, 10, 6)), e("Lazer", 150, date(2026, 10, 9)),
            e("Transporte", 120, date(2026, 10, 10)), *(e("Lazer", 80, d) for d in (date(2026, 10, 3), date(2026, 10, 12), date(2026, 10, 17))),
        ],
        [
            *monthly({"Moradia": 2000, "Mercado": 900, "Lazer": 300, "Transporte": 410}),
            e("Mercado", 1000, date(2026, 7, 12)), e("Mercado", 1100, date(2026, 8, 12)),
        ],
        today=date(2026, 10, 18),
        income=6000.0,
        recurring=rent(),
    )
    yield "week", build_insights(
        WEEK, date(2026, 10, 4), date(2026, 10, 10),
        [e("Mercado", 400, date(2026, 10, 5)), e("Lazer", 120, date(2026, 10, 6)), e("Mercado", 90, date(2026, 10, 8))],
        [e("Mercado", 200, date(2026, 9, 28)), e("Mercado", 210, date(2026, 9, 21)), e("Lazer", 60, date(2026, 9, 29))],
        date(2026, 10, 9),
    )
    yield "day", build_insights(
        DAY, date(2026, 10, 10), date(2026, 10, 10),
        [e("Mercado", 400, date(2026, 10, 10)), e("Lazer", 120, date(2026, 10, 10))],
        [e("Mercado", 200, date(2026, 10, 9)), e("Lazer", 60, date(2026, 10, 9))],
        date(2026, 10, 10),
    )
    yield "year", build_insights(
        YEAR, date(2026, 1, 1), date(2026, 12, 31),
        [e("Mercado", 12000, date(2026, 3, 5)), e("Lazer", 3000, date(2026, 6, 6))],
        [e("Mercado", 9000, date(2025, 3, 5)), e("Lazer", 3100, date(2025, 6, 6)), e("Mercado", 8000, date(2024, 3, 5)), e("Lazer", 3000, date(2024, 6, 6))],
        date(2027, 1, 5),
    )
    yield "custom_period", build_insights(
        PERIOD, date(2026, 10, 1), date(2026, 10, 20),
        [e("Mercado", 700, date(2026, 10, 5)), e("Lazer", 220, date(2026, 10, 6))],
        [e("Mercado", 400, date(2026, 9, 5)), e("Lazer", 100, date(2026, 9, 6)), e("Mercado", 380, date(2026, 8, 20))],
        date(2026, 11, 1),
    )


def normalize(value):
    """Decimal e float viram o mesmo número arredondado, para o snapshot não depender do tipo."""
    if isinstance(value, (float, Decimal)):
        return round(float(value), 9)

    if isinstance(value, dict):
        return {key: normalize(item) for key, item in value.items()}

    if isinstance(value, (list, tuple)):
        return [normalize(item) for item in value]

    return value


class InsightsSnapshotTests(SimpleTestCase):
    def reports(self):
        return {name: normalize(report) for name, report in scenarios()}

    def test_scenarios_cover_every_kind(self):
        kinds = {item["kind"] for report in self.reports().values() for item in report["insights"]}

        self.assertEqual(kinds, ALL_KINDS)

    def test_reports_match_snapshot(self):
        reports = self.reports()

        if os.environ.get("UPDATE_SNAPSHOT"):
            SNAPSHOT.write_text(json.dumps(reports, ensure_ascii=False, indent=1, sort_keys=True), encoding="utf-8")

        expected = json.loads(SNAPSHOT.read_text(encoding="utf-8"))

        self.assertEqual(sorted(reports), sorted(expected))

        for name, report in reports.items():
            with self.subTest(scenario=name):
                self.assertEqual(report, expected[name])
