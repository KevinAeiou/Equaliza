from decimal import Decimal

from ..constants import ALERT, MIN_DIFFERENCE, WARNING
from ..formatting import bar, format_currency, insight, percent

MIN_RISE = MIN_DIFFERENCE * Decimal("1.5")
MIN_RISE_RATIO = Decimal("1.25")
ALERT_RATIO = Decimal("1.5")


def rise(ctx):
    """Categoria que mais subiu em relação ao período anterior."""
    if not ctx.has_previous:
        return None

    spent, before = ctx.spent, ctx.before

    rises = sorted(
        (
            c
            for c in spent
            if before.get(c, 0) > 0
            and c != ctx.above_id
            and spent[c] - before[c] >= MIN_RISE
            and spent[c] >= before[c] * MIN_RISE_RATIO
        ),
        key=lambda c: spent[c] / before[c],
        reverse=True,
    )

    if not rises:
        return None

    category_id = rises[0]
    value, old = spent[category_id], before[category_id]
    peak = max(value, old)

    ctx.changed_id = category_id

    return insight(
        "rise",
        ALERT if value >= old * ALERT_RATIO else WARNING,
        "Em alta",
        f"{ctx.names[category_id]} subiu {percent((value - old) / old)}% em relação {ctx.versus}",
        f"De {format_currency(old)} para {format_currency(value)}: {format_currency(value - old)} a mais.",
        bars=[bar(ctx.same_point, old, peak), bar(ctx.unit["current"], value, peak, True)],
    )
