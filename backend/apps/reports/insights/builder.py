from decimal import Decimal

from .constants import MAX_INSIGHTS, TONE_RANK
from .context import build_context
from .formatting import empty_report
from .rules import RULES

ABOVE_RATIO = Decimal("1.05")
BELOW_RATIO = Decimal("0.95")


def _comparisons(ctx):
    """Comparação com a média, da maior categoria para a menor."""
    if not ctx.has_history:
        return []

    average = ctx.average

    return [
        {
            "name": ctx.names[category_id],
            "value": value,
            "average": average.get(category_id),
            "change": float((value - average[category_id]) / average[category_id])
            if average.get(category_id, 0) > 0
            else None,
        }
        for category_id, value in sorted(ctx.spent.items(), key=lambda pair: pair[1], reverse=True)
    ]


def build_insights(period_type, start, end, current, history, today, income=None, recurring=()):
    """Monta o relatório de insights.

    `current` são as despesas do período e `history` as dos INSIGHT_HISTORY períodos anteriores
    (veja `insights_window`). `income` é a receita do período (None quando há filtro de categorias)
    e `recurring` as despesas recorrentes ativas. Os valores podem ser Decimal, int ou float.
    """
    if not current:
        return empty_report()

    ctx = build_context(period_type, start, end, current, history, today, income, recurring)

    insights = [item for item in (rule(ctx) for rule in RULES) if item is not None]
    insights.sort(key=lambda item: TONE_RANK[item["tone"]])

    ids = {*ctx.spent, *ctx.average}
    average, spent, before = ctx.average, ctx.spent, ctx.before

    def count(predicate):
        return sum(1 for category_id in ids if predicate(category_id))

    return {
        "insights": insights[:MAX_INSIGHTS],
        "comparisons": _comparisons(ctx),
        "has_expenses": True,
        "has_history": ctx.has_history,
        "has_previous": ctx.has_previous,
        "history_periods": ctx.active,
        "average_label": ctx.average_label,
        "above_count": count(lambda c: average.get(c, 0) > 0 and spent.get(c, 0) > average[c] * ABOVE_RATIO)
        if ctx.has_history
        else 0,
        "below_count": count(lambda c: average.get(c, 0) > 0 and spent.get(c, 0) < average[c] * BELOW_RATIO)
        if ctx.has_history
        else 0,
        "dropped_count": count(lambda c: before.get(c, 0) > 0 and spent.get(c, 0) < before[c] * BELOW_RATIO)
        if ctx.has_previous
        else 0,
    }
