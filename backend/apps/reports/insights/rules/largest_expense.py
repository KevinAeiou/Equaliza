from decimal import Decimal

from ..constants import NEUTRAL, WARNING
from ..formatting import format_currency, insight, percent, progress

MIN_ENTRIES = 3
MIN_SHARE = Decimal("0.25")
WARNING_SHARE = Decimal("0.35")


def largest_expense(ctx):
    """Maior lançamento do período, quando pesa muito no total."""
    if len(ctx.current) < MIN_ENTRIES:
        return None

    biggest = max(ctx.current, key=lambda entry: entry.amount)
    share = biggest.amount / ctx.total

    if share < MIN_SHARE:
        return None

    return insight(
        "largest_expense",
        WARNING if share >= WARNING_SHARE else NEUTRAL,
        "Maior despesa",
        f"Uma única despesa pesa {percent(share)}% do período",
        f'"{biggest.title}", de {format_currency(biggest.amount)}, é o maior lançamento — '
        f"{percent(biggest.amount / ctx.spent[biggest.category_id])}% de tudo o que você gastou em {biggest.category}.",
        progress=progress(share, format_currency(biggest.amount), f"Total {format_currency(ctx.total)}"),
    )
