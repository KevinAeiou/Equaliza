from decimal import Decimal

from ..constants import MIN_DIFFERENCE, WARNING
from ..context import sum_by_category
from ..formatting import format_currency, insight, spark_point
from ..periods import short_label

MIN_GROWTH = Decimal("1.10")


def trend(ctx):
    """Categoria que vem subindo períodos seguidos (precisa dos dois anteriores)."""
    spent = ctx.spent
    p1, p2, p3 = (sum_by_category(bucket) for bucket in ctx.buckets[:3])

    rising = sorted(
        (
            c
            for c in spent
            if c not in (ctx.above_id, ctx.changed_id)
            and p2.get(c, 0) > 0
            and p1.get(c, 0) > p2[c]
            and spent[c] > p1[c]
            and spent[c] - p2[c] >= MIN_DIFFERENCE
            and spent[c] >= p2[c] * MIN_GROWTH
        ),
        key=lambda c: spent[c] / p2[c],
        reverse=True,
    )

    if not rising:
        return None

    category_id = rising[0]
    priors = ctx.priors
    points = [
        *([(priors[2][0], p3[category_id])] if p3.get(category_id, 0) > 0 else []),
        (priors[1][0], p2[category_id]),
        (priors[0][0], p1[category_id]),
        (ctx.start, spent[category_id]),
    ]
    peak = max(value for _, value in points)
    plural = ctx.unit["plural"]

    return insight(
        "trend",
        WARNING,
        "Tendência de alta",
        f"{ctx.names[category_id]} vem subindo há 3 {plural}",
        f"Subiu de {format_currency(p2[category_id])} para {format_currency(spent[category_id])} "
        f"nos últimos 3 {plural}. Vale rever esse gasto antes que vire hábito.",
        spark=[
            spark_point(short_label(ctx.period_type, when), value, peak, index == len(points) - 1)
            for index, (when, value) in enumerate(points)
        ],
    )
