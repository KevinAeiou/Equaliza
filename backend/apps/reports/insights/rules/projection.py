from decimal import Decimal

from ..constants import ALERT, GOOD, MIN_DIFFERENCE, WARNING
from ..formatting import ZERO, bar, format_currency, insight, percent

# Dias já decorridos para a projeção fazer sentido.
MIN_ELAPSED_DAYS = 5
MIN_RATIO = Decimal("0.10")
ALERT_RATIO = Decimal("0.30")


def projection(ctx):
    """Projeção do fechamento de um período em andamento, frente à média."""
    length, elapsed = ctx.length, ctx.elapsed

    if not (ctx.ongoing and length > 1 and MIN_ELAPSED_DAYS <= elapsed < length and ctx.has_history):
        return None

    total = ctx.total
    projected = total / elapsed * length
    mean_total = sum((sum((entry.amount for entry in bucket), ZERO) for bucket in ctx.buckets), ZERO) / ctx.active
    diff = projected - mean_total

    if abs(diff) < MIN_DIFFERENCE or abs(diff) / mean_total < MIN_RATIO:
        return None

    over_mean = diff > 0
    peak = max(projected, mean_total)

    return insight(
        "projection",
        (ALERT if diff / mean_total >= ALERT_RATIO else WARNING) if over_mean else GOOD,
        "Projeção",
        f"No ritmo atual, você fecha com {format_currency(projected)} em despesas",
        f"Em {elapsed} dos {length} dias você gastou {format_currency(total)}. "
        f"Isso aponta para {percent(abs(diff) / mean_total)}% {'acima' if over_mean else 'abaixo'} "
        f"da média total {ctx.average_label} ({format_currency(mean_total)}).",
        bars=[bar("Projeção", projected, peak, True), bar("Média", mean_total, peak)],
    )
