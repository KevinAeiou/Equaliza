from decimal import Decimal

from ..constants import GOOD, MIN_DIFFERENCE
from ..formatting import format_currency, insight, progress

MAX_RATIO = Decimal("0.9")


def below_average(ctx):
    """Margem até a média (período em andamento) ou quanto ficou abaixo dela."""
    if not ctx.has_history:
        return None

    spent, average = ctx.spent, ctx.average

    below = sorted(
        (
            c
            for c in average
            if c in spent
            and average[c] > 0
            and spent[c] <= average[c] * MAX_RATIO
            and average[c] - spent[c] >= MIN_DIFFERENCE
        ),
        key=lambda c: average[c] - spent[c],
        reverse=True,
    )

    if not below:
        return None

    category_id = below[0]
    value, mean = spent[category_id], average[category_id]
    gap = mean - value
    name = ctx.names[category_id]

    return insight(
        "below_average",
        GOOD,
        "Margem até a média" if ctx.ongoing else "Abaixo da média",
        f"{name}: faltam {format_currency(gap)} para chegar à média"
        if ctx.ongoing
        else f"{name} ficou {format_currency(gap)} abaixo da média",
        f"Você gastou {format_currency(value)} e a média da categoria {ctx.average_label} é {format_currency(mean)}."
        + (" Esse é o espaço que ainda há antes de gastar mais do que costuma." if ctx.ongoing else ""),
        progress=progress(value / mean, f"{format_currency(value)} gastos", f"Média {format_currency(mean)}"),
    )
