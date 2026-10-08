from decimal import Decimal

from ..constants import ALERT, GOOD, MIN_DIFFERENCE, WARNING
from ..formatting import bar, format_currency, insight, percent

MIN_DROP = Decimal("-0.05")
MIN_RISE = Decimal("0.10")
ALERT_RISE = Decimal("0.30")


def total_change(ctx):
    """Variação do total das despesas, só quando a mudança é relevante."""
    if not ctx.has_previous:
        return None

    total, previous_total = ctx.total, ctx.previous_total

    if previous_total <= 0 or abs(total - previous_total) < MIN_DIFFERENCE:
        return None

    change = (total - previous_total) / previous_total
    peak = max(total, previous_total)

    if not (change <= MIN_DROP or change >= MIN_RISE):
        return None

    if change <= MIN_DROP:
        tone = GOOD
    elif change >= ALERT_RISE:
        tone = ALERT
    else:
        tone = WARNING

    return insight(
        "total_change",
        tone,
        "Despesas em queda" if change < 0 else "Despesas em alta",
        f"Suas despesas {'caíram' if change < 0 else 'subiram'} {percent(abs(change))}% em relação {ctx.versus}",
        f"De {format_currency(previous_total)} para {format_currency(total)}: "
        f"{format_currency(abs(total - previous_total))} {'a menos' if change < 0 else 'a mais'}.",
        bars=[
            bar(ctx.same_point, previous_total, peak),
            bar(ctx.unit["current"], total, peak, True),
        ],
    )
