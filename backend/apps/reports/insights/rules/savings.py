from ..constants import ALERT
from ..formatting import bar, format_currency, insight, percent


def savings(ctx):
    """Alerta quando as despesas passam da receita do período."""
    income = ctx.income

    if not income or income <= 0:
        return None

    total = ctx.total
    ongoing = ctx.ongoing
    ratio = total / income
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

    # Folga e economia não viram card: o saldo de cada membro pode ser usado em outras famílias.
    return None
