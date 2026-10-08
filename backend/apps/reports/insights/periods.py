"""Aritmética de períodos: deslocamento e janela de referência."""

import calendar
from datetime import date, timedelta

from .constants import DAY, INSIGHT_HISTORY, MONTH, MONTHS, PERIOD, WEEK, YEAR


def _add_months(day, months):
    index = day.year * 12 + day.month - 1 + months

    return date(index // 12, index % 12 + 1, 1)


def _month_end(day):
    return day.replace(day=calendar.monthrange(day.year, day.month)[1])


def shift_period(period_type, start, end, step):
    """Período equivalente `step` períodos adiante (negativo, para trás)."""
    if period_type == DAY:
        shifted = start + timedelta(days=step)

        return shifted, shifted

    if period_type == WEEK:
        days = timedelta(days=7 * step)

        return start + days, start + days + (end - start)

    if period_type == YEAR:
        year = start.year + step

        return date(year, 1, 1), date(year, 12, 31)

    if period_type == PERIOD:
        days = timedelta(days=((end - start).days + 1) * step)

        return start + days, end + days

    first = _add_months(start, step)

    return first, _month_end(first)


def insights_window(period_type, start, end):
    """Intervalo que cobre os períodos usados como referência (do 6º anterior ao imediatamente anterior)."""
    return shift_period(period_type, start, end, -INSIGHT_HISTORY)[0], shift_period(period_type, start, end, -1)[1]


def short_label(period_type, start):
    if period_type == MONTH:
        return MONTHS[start.month - 1]

    if period_type == YEAR:
        return str(start.year)

    return start.strftime("%d/%m")
