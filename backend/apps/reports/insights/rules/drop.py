from decimal import Decimal

from ..constants import GOOD, MIN_DIFFERENCE
from ..formatting import bar, format_currency, insight, percent

MAX_DROP_RATIO = Decimal("0.9")


def drop(ctx):
    """Maior queda em reais (ao menos 10%) em relação ao período anterior."""
    if not ctx.has_previous:
        return None

    spent, before = ctx.spent, ctx.before

    drops = sorted(
        (
            c
            for c in spent
            if before.get(c, 0) > 0
            and before[c] - spent[c] >= MIN_DIFFERENCE
            and spent[c] <= before[c] * MAX_DROP_RATIO
        ),
        key=lambda c: before[c] - spent[c],
        reverse=True,
    )

    # Categorias que também caíram até zerar não aparecem em `spent`.
    vanished = sorted(
        (c for c in before if c not in spent and before[c] >= MIN_DIFFERENCE),
        key=lambda c: before[c],
        reverse=True,
    )

    if not drops and not vanished:
        return None

    use_vanished = not drops
    category_id = vanished[0] if use_vanished else drops[0]
    value = spent.get(category_id, 0)
    old = before[category_id]
    peak = max(value, old)
    name = ctx.names[category_id]

    if use_vanished:
        title = f"{name} não teve gastos, contra {format_currency(old)} {ctx.versus}"
        body = "Foram " + format_currency(old) + " a menos nessa categoria."
    else:
        title = f"{name} caiu {percent((old - value) / old)}% em relação {ctx.versus}"
        body = (
            f"De {format_currency(old)} para {format_currency(value)}: {format_currency(old - value)} a menos. "
            "Foi o maior recuo entre as suas categorias."
        )

    return insight(
        "drop",
        GOOD,
        "Em queda",
        title,
        body,
        bars=[bar(ctx.same_point, old, peak), bar(ctx.unit["current"], value, peak, True)],
    )
