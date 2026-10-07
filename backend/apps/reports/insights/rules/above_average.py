from decimal import Decimal

from ..constants import ALERT, MIN_DIFFERENCE, WARNING
from ..formatting import bar, format_currency, insight, percent

MIN_RATIO_BIGGEST = Decimal("0.10")
MIN_RATIO_OTHERS = Decimal("0.20")
ALERT_RATIO = Decimal("0.30")
CONCENTRATED_SHARE = Decimal("0.4")


def above_average(ctx):
    """Maior categoria acima da média; sem ela, a categoria que mais se afastou para cima."""
    if not ctx.has_history:
        return None

    spent, average = ctx.spent, ctx.average

    def over(category_id):
        return (spent[category_id] - average[category_id]) / average[category_id]

    known = [
        category_id
        for category_id in spent
        if average.get(category_id, 0) > 0 and spent[category_id] - average[category_id] >= MIN_DIFFERENCE
    ]

    if not known:
        return None

    biggest = max(spent, key=lambda category_id: spent[category_id])
    by_ratio = sorted((c for c in known if over(c) >= MIN_RATIO_OTHERS), key=over, reverse=True)

    if biggest in known and over(biggest) >= MIN_RATIO_BIGGEST:
        category_id = biggest
    elif by_ratio:
        category_id = by_ratio[0]
    else:
        return None

    ctx.above_id = category_id

    value = spent[category_id]
    mean = average[category_id]
    ratio = over(category_id)
    share = value / ctx.total
    peak = max(value, mean)
    name = ctx.names[category_id]
    unit = ctx.unit

    spent_text = (
        f"Você já gastou {format_currency(value)} {unit['this']}"
        if ctx.ongoing
        else f"Você gastou {format_currency(value)} no período"
    )

    return insight(
        "above_average",
        ALERT if ratio >= ALERT_RATIO else WARNING,
        "Gasto elevado" if ratio >= ALERT_RATIO else "Acima da média",
        f"{name} {'está' if ctx.ongoing else 'ficou'} {percent(ratio)}% acima da sua média",
        f"{spent_text}. A média {ctx.average_label} é {format_currency(mean)} "
        f"— são {format_currency(value - mean)} a mais.",
        bars=[
            bar(unit["current"], value, peak, True),
            bar("Média", mean, peak),
        ],
        note=f"{name} concentra {percent(share)}% de todas as despesas."
        if share >= CONCENTRATED_SHARE and len(spent) > 1
        else None,
    )
