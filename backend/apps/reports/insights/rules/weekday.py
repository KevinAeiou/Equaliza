from decimal import Decimal

from ..constants import NEUTRAL, WEEKDAY_ORDER, WEEKDAY_SHORT, WEEKDAYS
from ..formatting import ZERO, format_currency, insight, percent, spark_point

MIN_LENGTH_DAYS = 14
MIN_ENTRIES = 8
MIN_SHARE = Decimal("0.30")


def weekday(ctx):
    """Dia da semana em que os gastos se concentram."""
    if ctx.length < MIN_LENGTH_DAYS or len(ctx.current) < MIN_ENTRIES:
        return None

    by_weekday = [ZERO] * 7

    for entry in ctx.current:
        by_weekday[entry.date.weekday()] += entry.amount

    top_day = max(range(7), key=lambda day: by_weekday[day])
    share = by_weekday[top_day] / ctx.total

    if share < MIN_SHARE:
        return None

    peak = by_weekday[top_day]

    return insight(
        "weekday",
        NEUTRAL,
        "Dia da semana",
        f"{WEEKDAYS[top_day]} concentram {percent(share)}% das despesas",
        f"{format_currency(by_weekday[top_day])} de {format_currency(ctx.total)} foram gastos em "
        f"{WEEKDAYS[top_day].lower()}. Se quiser economizar, vale olhar para esse dia primeiro.",
        spark=[spark_point(WEEKDAY_SHORT[day], by_weekday[day], peak, day == top_day) for day in WEEKDAY_ORDER],
    )
