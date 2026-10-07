from decimal import Decimal

from ..constants import NEUTRAL
from ..formatting import format_currency, insight, percent, progress

MIN_SHARE = Decimal("0.5")


def concentration(ctx):
    """Dependência de uma única categoria, quando o insight de média já não a cobre."""
    if len(ctx.spent) < 2:
        return None

    top = max(ctx.spent, key=lambda category_id: ctx.spent[category_id])
    share = ctx.spent[top] / ctx.total

    if share < MIN_SHARE or top == ctx.above_id:
        return None

    name = ctx.names[top]

    return insight(
        "concentration",
        NEUTRAL,
        "Concentração",
        f"{name} concentra {percent(share)}% das despesas",
        f"{format_currency(ctx.spent[top])} de {format_currency(ctx.total)} no período. "
        "Uma variação nessa categoria muda muito o seu total.",
        progress=progress(share, name, f"Total {format_currency(ctx.total)}"),
    )
