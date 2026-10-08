from apps.finance.utils import occurrence_date

from ..constants import MIN_DIFFERENCE, NEUTRAL
from ..formatting import ZERO, format_currency, insight, progress

# Limite de segurança: quantas ocorrências futuras de uma recorrência examinar.
MAX_OCCURRENCES = 400


def upcoming_occurrences(recurring, start, end):
    """Despesas recorrentes ainda não lançadas que caem até o fim do período."""
    occurrences = []

    for item in recurring:
        for index in range(item.generated_count, item.generated_count + MAX_OCCURRENCES):
            when = occurrence_date(item.start_date, item.frequency, index)

            if when > end or (item.end_date and when > item.end_date):
                break

            if when >= start:
                occurrences.append((when, item))

    return occurrences


def upcoming(ctx):
    """Despesas recorrentes que ainda vão cair no período em andamento."""
    if not ctx.ongoing:
        return None

    occurrences = upcoming_occurrences(ctx.recurring, ctx.start, ctx.end)
    upcoming_total = sum((item.amount for _, item in occurrences), ZERO)

    if upcoming_total < MIN_DIFFERENCE:
        return None

    biggest_when, biggest_item = max(occurrences, key=lambda pair: pair[1].amount)
    count = len(occurrences)
    total = ctx.total

    return insight(
        "upcoming",
        NEUTRAL,
        "A vencer",
        f"Ainda há {format_currency(upcoming_total)} em despesas recorrentes até o fim do período",
        f"{count} lançamento{'s' if count > 1 else ''} programado{'s' if count > 1 else ''}; "
        f"o maior é \"{biggest_item.title}\", de {format_currency(biggest_item.amount)}, "
        f"em {biggest_when.strftime('%d/%m')}.",
        progress=progress(
            total / (total + upcoming_total),
            f"Gasto {format_currency(total)}",
            f"Previsto {format_currency(total + upcoming_total)}",
        ),
    )
