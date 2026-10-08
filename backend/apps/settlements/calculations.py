"""Cálculo puro do acerto de contas: sem banco, só dicionários e Decimals.

Os ids dos membros são chaves opacas. Todos os valores têm duas casas e a soma dos saldos
de uma família é sempre zero.
"""

from collections import defaultdict
from decimal import ROUND_FLOOR, Decimal

ZERO = Decimal("0.00")
CENTS = Decimal("0.01")


def _to_cents(value):
    return int((Decimal(value) / CENTS).to_integral_value())


def _from_cents(cents):
    return Decimal(cents) * CENTS


def split_proportionally(total, weights):
    """Divide `total` na proporção de `weights`, sem perder centavos (maior resto).

    Os centavos que sobram vão para quem tem o maior resto; em empate, para o menor id,
    para o resultado ser determinístico. Com todos os pesos zerados, divide igualmente.
    """
    if not weights:
        return {}

    total_cents = _to_cents(total)
    keys = sorted(weights)
    raw = {key: Decimal(weights[key]) for key in keys}
    weight_sum = sum(raw.values())

    if weight_sum <= 0:
        raw = {key: Decimal(1) for key in keys}
        weight_sum = Decimal(len(keys))

    shares = {}
    remainders = {}

    for key in keys:
        exact = Decimal(total_cents) * raw[key] / weight_sum
        floor = int(exact.to_integral_value(rounding=ROUND_FLOOR))
        shares[key] = floor
        remainders[key] = exact - floor

    leftover = total_cents - sum(shares.values())
    # `keys` já está ordenado, então o sort estável desempata pelo menor id.
    for key in sorted(keys, key=lambda k: remainders[k], reverse=True)[:leftover]:
        shares[key] += 1

    return {key: _from_cents(cents) for key, cents in shares.items()}


def month_quotas(total_expense, incomes, active_ids):
    """Cota de cada membro nas despesas do mês.

    Proporcional à receita do mês; sem receita, divide igualmente entre os membros ativos.
    """
    positive = {key: value for key, value in incomes.items() if value > 0}

    if positive:
        return split_proportionally(total_expense, positive)

    return split_proportionally(total_expense, {key: 1 for key in active_ids})


def month_differences(paid, quotas):
    """Diferença (pago − cota) de cada membro que pagou ou tem cota no mês."""
    return {
        key: paid.get(key, ZERO) - quotas.get(key, ZERO)
        for key in set(paid) | set(quotas)
    }


def accumulate_balances(monthly_differences, settlements=()):
    """Saldo acumulado: Σ diferenças dos meses + acertos (quem paga soma, quem recebe subtrai).

    `monthly_differences` é uma lista de dicionários `{membro: diferença}`, um por mês;
    `settlements` é um iterável de `(pagador, recebedor, valor)`.
    """
    balances = defaultdict(lambda: ZERO)

    for differences in monthly_differences:
        for key, value in differences.items():
            balances[key] += value

    for payer, receiver, amount in settlements:
        balances[payer] += amount
        balances[receiver] -= amount

    return dict(balances)


def suggest_settlements(balances):
    """Sugere quem paga quem: devedores (saldo < 0) quitam credores (saldo > 0).

    Pareia o maior devedor com o maior credor, o que mantém o número de pagamentos baixo
    e o resultado determinístico. Devolve `(pagador, recebedor, valor)`.
    """
    debtors = sorted(
        ((-value, key) for key, value in balances.items() if value < 0),
        key=lambda item: (-item[0], item[1]),
    )
    creditors = sorted(
        ((value, key) for key, value in balances.items() if value > 0),
        key=lambda item: (-item[0], item[1]),
    )
    debtors = [list(item) for item in debtors]
    creditors = [list(item) for item in creditors]

    suggestions = []
    d = c = 0

    while d < len(debtors) and c < len(creditors):
        amount = min(debtors[d][0], creditors[c][0])
        suggestions.append((debtors[d][1], creditors[c][1], amount))
        debtors[d][0] -= amount
        creditors[c][0] -= amount

        if debtors[d][0] == 0:
            d += 1
        if creditors[c][0] == 0:
            c += 1

    return suggestions
