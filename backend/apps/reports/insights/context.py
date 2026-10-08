"""Dados de entrada e o contexto calculado uma vez e compartilhado por todos os insights."""

from collections import namedtuple
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal

from .constants import INSIGHT_HISTORY, MIN_HISTORY_PERIODS, UNITS
from .formatting import ZERO, money
from .periods import shift_period

Entry = namedtuple("Entry", "date category_id category title amount")
Recurring = namedtuple("Recurring", "category_id title amount frequency start_date end_date generated_count")


def sum_by_category(entries):
    sums = {}

    for entry in entries:
        sums[entry.category_id] = sums.get(entry.category_id, ZERO) + entry.amount

    return sums


@dataclass
class Context:
    period_type: str
    start: date
    end: date
    today: date
    current: list
    income: Decimal | None
    recurring: list

    unit: dict
    ongoing: bool
    length: int
    elapsed: int

    priors: list
    buckets: list
    active: int
    has_history: bool
    has_previous: bool

    names: dict
    spent: dict
    before: dict
    average: dict
    total: Decimal
    previous_total: Decimal

    average_label: str
    versus: str
    same_point: str

    # Preenchidos pelos insights que rodam antes, para os seguintes não repetirem a categoria.
    above_id: int | None = field(default=None)
    changed_id: int | None = field(default=None)


def _normalize(entries):
    return [entry._replace(amount=money(entry.amount)) for entry in entries]


def build_context(period_type, start, end, current, history, today, income, recurring):
    """Normaliza os valores para Decimal e calcula o que vários insights usam."""
    current = _normalize(current)
    history = _normalize(history)
    recurring = [item._replace(amount=money(item.amount)) for item in recurring]
    income = None if income is None else money(income)

    unit = UNITS[period_type]
    ongoing = start <= today <= end

    priors = [shift_period(period_type, start, end, -i) for i in range(1, INSIGHT_HISTORY + 1)]
    buckets = [[entry for entry in history if prior[0] <= entry.date <= prior[1]] for prior in priors]

    active = sum(1 for bucket in buckets if bucket)
    has_history = active >= MIN_HISTORY_PERIODS

    # Em um período em andamento, o anterior é cortado no mesmo ponto para a comparação ser justa.
    previous = buckets[0]

    if ongoing:
        cutoff = priors[0][0] + timedelta(days=(today - start).days)
        previous = [entry for entry in previous if entry.date <= cutoff]

    names = {entry.category_id: entry.category for entry in [*current, *history]}
    spent = sum_by_category(current)
    before = sum_by_category(previous)

    average = {}

    if has_history:
        for category_id, value in sum_by_category(entry for bucket in buckets for entry in bucket).items():
            average[category_id] = value / active

    return Context(
        period_type=period_type,
        start=start,
        end=end,
        today=today,
        current=current,
        income=income,
        recurring=recurring,
        unit=unit,
        ongoing=ongoing,
        length=(end - start).days + 1,
        elapsed=(today - start).days + 1,
        priors=priors,
        buckets=buckets,
        active=active,
        has_history=has_history,
        has_previous=bool(previous),
        names=names,
        spent=spent,
        before=before,
        average=average,
        total=sum(spent.values(), ZERO),
        previous_total=sum(before.values(), ZERO),
        average_label=f"{unit['of']} {active} {unit['plural']} anteriores",
        versus=f"ao mesmo ponto {unit['previous_of']}" if ongoing else unit["previous_to"],
        same_point="Mesmo ponto" if ongoing else "Anterior",
    )
