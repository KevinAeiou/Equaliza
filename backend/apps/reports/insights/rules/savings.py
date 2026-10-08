from decimal import Decimal

from ..constants import ALERT, GOOD, WARNING
from ..formatting import bar, format_currency, insight, percent, progress

TIGHT_RATIO = Decimal("0.9")
GOOD_SAVINGS = Decimal("0.2")


def savings(ctx):
    """Despesas frente à receita do período."""
    income = ctx.income

    if not income or income <= 0:
        return None

    total = ctx.total
    ongoing = ctx.ongoing
    ratio = total / income
    left = income - total
    peak = max(income, total)

    if total > income:
        return insight(
            "savings",
            ALERT,
            "Despesas acima da receita",
            f"{'Você está gastando' if ongoing else 'Você gastou'} {format_currency(total - income)} a mais do que recebeu",
            f"As despesas somam {format_currency(total)} para {format_currency(income)} de receita "
            f"({percent(ratio)}% da receita).",
            bars=[bar("Receitas", income, peak), bar("Despesas", total, peak, True)],
        )

    meter = progress(ratio, f"Despesas {format_currency(total)}", f"Receitas {format_currency(income)}")

    if ratio >= TIGHT_RATIO:
        return insight(
            "savings",
            WARNING,
            "Pouca folga",
            f"As despesas {'consomem' if ongoing else 'consumiram'} {percent(ratio)}% da receita",
            f"Sobram só {format_currency(left)} de {format_currency(income)} recebidos. "
            "Qualquer imprevisto pode fechar o período no vermelho.",
            progress=meter,
        )

    if left / income >= GOOD_SAVINGS:
        return insight(
            "savings",
            GOOD,
            "Poupança",
            f"{'Você está guardando' if ongoing else 'Você guardou'} {percent(left / income)}% da receita",
            f"{format_currency(left)} sobram de {format_currency(income)} recebidos "
            f"depois de {format_currency(total)} em despesas.",
            progress=meter,
        )

    return None
