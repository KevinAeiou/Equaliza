"""Insights sobre as despesas de um período.

Cálculo puro (sem acesso ao banco): recebe as despesas já carregadas e devolve o relatório
que o dashboard exibe. Cada insight só aparece quando há dados para sustentá-lo.
"""

import calendar
from collections import namedtuple
from datetime import date, timedelta

from apps.finance.utils import occurrence_date

# Quantos períodos anteriores entram na média.
INSIGHT_HISTORY = 6

# Períodos anteriores com despesas necessários para falar em "média".
MIN_HISTORY_PERIODS = 2

# Diferenças menores que isso (em reais) são ruído e não geram insight.
MIN_DIFFERENCE = 30.0

MAX_INSIGHTS = 8

DAY, WEEK, MONTH, YEAR, PERIOD = "DAY", "WEEK", "MONTH", "YEAR", "PERIOD"
PERIOD_TYPES = (DAY, WEEK, MONTH, YEAR, PERIOD)

ALERT, WARNING, NEUTRAL, GOOD = "alert", "warning", "neutral", "good"
_TONE_RANK = {ALERT: 0, WARNING: 1, NEUTRAL: 2, GOOD: 3}

Entry = namedtuple("Entry", "date category_id category title amount")
Recurring = namedtuple("Recurring", "category_id title amount frequency start_date end_date generated_count")

_UNITS = {
    DAY: {
        "plural": "dias",
        "of": "dos",
        "current": "Hoje",
        "this": "neste dia",
        "previous_to": "ao dia anterior",
        "previous_of": "do dia anterior",
    },
    WEEK: {
        "plural": "semanas",
        "of": "das",
        "current": "Esta semana",
        "this": "nesta semana",
        "previous_to": "à semana anterior",
        "previous_of": "da semana anterior",
    },
    MONTH: {
        "plural": "meses",
        "of": "dos",
        "current": "Este mês",
        "this": "neste mês",
        "previous_to": "ao mês anterior",
        "previous_of": "do mês anterior",
    },
    YEAR: {
        "plural": "anos",
        "of": "dos",
        "current": "Este ano",
        "this": "neste ano",
        "previous_to": "ao ano anterior",
        "previous_of": "do ano anterior",
    },
    PERIOD: {
        "plural": "períodos",
        "of": "dos",
        "current": "Este período",
        "this": "neste período",
        "previous_to": "ao período anterior",
        "previous_of": "do período anterior",
    },
}

_MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

# Segunda = 0 (como em date.weekday()); a exibição começa no domingo.
_WEEKDAYS = ["Segundas-feiras", "Terças-feiras", "Quartas-feiras", "Quintas-feiras", "Sextas-feiras", "Sábados", "Domingos"]
_WEEKDAY_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
_WEEKDAY_ORDER = [6, 0, 1, 2, 3, 4, 5]


def format_currency(value):
    text = f"{abs(value):,.2f}".replace(",", "_").replace(".", ",").replace("_", ".")

    return f"{'-' if value < 0 else ''}R$\xa0{text}"


def _percent(ratio):
    # Arredonda meio para cima (round() do Python arredonda para o par).
    return int(ratio * 100 + 0.5)


def _add_months(day, months):
    index = day.year * 12 + day.month - 1 + months

    return date(index // 12, index % 12 + 1, 1)


def _month_end(day):
    return day.replace(day=calendar.monthrange(day.year, day.month)[1])


def shift_period(period_type, start, end, step):
    """Período equivalente `step` períodos adiante (negativo, para trás)."""
    if period_type == DAY:
        shifted = start + timedelta(days=step)

        return shifted, shifted

    if period_type == WEEK:
        days = timedelta(days=7 * step)

        return start + days, start + days + (end - start)

    if period_type == YEAR:
        year = start.year + step

        return date(year, 1, 1), date(year, 12, 31)

    if period_type == PERIOD:
        days = timedelta(days=((end - start).days + 1) * step)

        return start + days, end + days

    first = _add_months(start, step)

    return first, _month_end(first)


def insights_window(period_type, start, end):
    """Intervalo que cobre os períodos usados como referência (do 6º anterior ao imediatamente anterior)."""
    return shift_period(period_type, start, end, -INSIGHT_HISTORY)[0], shift_period(period_type, start, end, -1)[1]


def _short_label(period_type, start):
    if period_type == MONTH:
        return _MONTHS[start.month - 1]

    if period_type == YEAR:
        return str(start.year)

    return start.strftime("%d/%m")


def _sum_by_category(entries):
    sums = {}

    for entry in entries:
        sums[entry.category_id] = sums.get(entry.category_id, 0) + entry.amount

    return sums


def _bar(label, value, peak, highlighted=False):
    return {
        "label": label,
        "value": format_currency(value),
        "fraction": value / peak if peak else 0,
        "highlighted": highlighted,
    }


def _progress(fraction, start, end):
    return {"fraction": min(max(fraction, 0), 1), "start": start, "end": end}


def _insight(kind, tone, tag, title, body, bars=None, progress=None, spark=None, note=None):
    return {
        "kind": kind,
        "tone": tone,
        "tag": tag,
        "title": title,
        "body": body,
        "bars": bars or [],
        "progress": progress,
        "spark": spark or [],
        "note": note,
    }


def _empty_report():
    return {
        "insights": [],
        "comparisons": [],
        "has_expenses": False,
        "has_history": False,
        "has_previous": False,
        "history_periods": 0,
        "average_label": "",
        "above_count": 0,
        "below_count": 0,
        "dropped_count": 0,
    }


def _upcoming(recurring, start, end):
    """Despesas recorrentes ainda não lançadas que caem até o fim do período."""
    occurrences = []

    for item in recurring:
        for index in range(item.generated_count, item.generated_count + 400):
            when = occurrence_date(item.start_date, item.frequency, index)

            if when > end or (item.end_date and when > item.end_date):
                break

            if when >= start:
                occurrences.append((when, item))

    return occurrences


def build_insights(period_type, start, end, current, history, today, income=None, recurring=()):
    """Monta o relatório de insights.

    `current` são as despesas do período e `history` as dos INSIGHT_HISTORY períodos anteriores
    (veja `insights_window`). `income` é a receita do período (None quando há filtro de categorias)
    e `recurring` as despesas recorrentes ativas.
    """
    if not current:
        return _empty_report()

    unit = _UNITS[period_type]
    ongoing = start <= today <= end

    priors = [shift_period(period_type, start, end, -i) for i in range(1, INSIGHT_HISTORY + 1)]
    buckets = [[entry for entry in history if prior[0] <= entry.date <= prior[1]] for prior in priors]

    active = sum(1 for bucket in buckets if bucket)
    has_history = active >= MIN_HISTORY_PERIODS

    # Em um período em andamento, o anterior é cortado no mesmo ponto para a comparação ser justa.
    previous = buckets[0]

    if ongoing:
        cutoff = priors[0][0] + timedelta(days=(today - start).days)
        previous = [entry for entry in previous if entry.date <= cutoff]

    has_previous = bool(previous)

    names = {entry.category_id: entry.category for entry in [*current, *history]}
    spent = _sum_by_category(current)
    before = _sum_by_category(previous)
    total = sum(spent.values())
    previous_total = sum(before.values())

    average = {}

    if has_history:
        for category_id, value in _sum_by_category(entry for bucket in buckets for entry in bucket).items():
            average[category_id] = value / active

    average_label = f"{unit['of']} {active} {unit['plural']} anteriores"
    versus = f"ao mesmo ponto {unit['previous_of']}" if ongoing else unit["previous_to"]
    same_point = "Mesmo ponto" if ongoing else "Anterior"
    insights = []

    # Maior categoria acima da média; sem ela, a categoria que mais se afastou para cima.
    above_id = None

    if has_history:

        def over(category_id):
            return (spent[category_id] - average[category_id]) / average[category_id]

        known = [
            category_id
            for category_id in spent
            if average.get(category_id, 0) > 0 and spent[category_id] - average[category_id] >= MIN_DIFFERENCE
        ]

        if known:
            biggest = max(spent, key=lambda category_id: spent[category_id])
            by_ratio = sorted((c for c in known if over(c) >= 0.20), key=over, reverse=True)

            if biggest in known and over(biggest) >= 0.10:
                above_id = biggest
            elif by_ratio:
                above_id = by_ratio[0]

        if above_id is not None:
            value = spent[above_id]
            mean = average[above_id]
            ratio = over(above_id)
            share = value / total
            peak = max(value, mean)
            name = names[above_id]

            spent_text = (
                f"Você já gastou {format_currency(value)} {unit['this']}"
                if ongoing
                else f"Você gastou {format_currency(value)} no período"
            )

            insights.append(
                _insight(
                    "above_average",
                    ALERT if ratio >= 0.30 else WARNING,
                    "Gasto elevado" if ratio >= 0.30 else "Acima da média",
                    f"{name} {'está' if ongoing else 'ficou'} {_percent(ratio)}% acima da sua média",
                    f"{spent_text}. A média {average_label} é {format_currency(mean)} "
                    f"— são {format_currency(value - mean)} a mais.",
                    bars=[
                        _bar(unit["current"], value, peak, True),
                        _bar("Média", mean, peak),
                    ],
                    note=f"{name} concentra {_percent(share)}% de todas as despesas."
                    if share >= 0.4 and len(spent) > 1
                    else None,
                )
            )

    # Comparações com o período anterior.
    changed_id = None

    if has_previous:
        both = [category_id for category_id in spent if before.get(category_id, 0) > 0]

        # Maior queda em reais, ao menos 10%.
        drops = sorted(
            (
                c
                for c in both
                if before[c] - spent[c] >= MIN_DIFFERENCE and spent[c] <= before[c] * 0.9
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

        rises = sorted(
            (
                c
                for c in both
                if c != above_id and spent[c] - before[c] >= MIN_DIFFERENCE * 1.5 and spent[c] >= before[c] * 1.25
            ),
            key=lambda c: spent[c] / before[c],
            reverse=True,
        )

        if rises:
            category_id = rises[0]
            value, old = spent[category_id], before[category_id]
            peak = max(value, old)

            changed_id = category_id
            insights.append(
                _insight(
                    "rise",
                    ALERT if value >= old * 1.5 else WARNING,
                    "Em alta",
                    f"{names[category_id]} subiu {_percent((value - old) / old)}% em relação {versus}",
                    f"De {format_currency(old)} para {format_currency(value)}: {format_currency(value - old)} a mais.",
                    bars=[_bar(same_point, old, peak), _bar(unit["current"], value, peak, True)],
                )
            )

        if drops or vanished:
            use_vanished = not drops
            category_id = vanished[0] if use_vanished else drops[0]
            value = spent.get(category_id, 0)
            old = before[category_id]
            peak = max(value, old)

            if use_vanished:
                title = f"{names[category_id]} não teve gastos, contra {format_currency(old)} {versus}"
                body = "Foram " + format_currency(old) + " a menos nessa categoria."
            else:
                title = f"{names[category_id]} caiu {_percent((old - value) / old)}% em relação {versus}"
                body = (
                    f"De {format_currency(old)} para {format_currency(value)}: {format_currency(old - value)} a menos. "
                    "Foi o maior recuo entre as suas categorias."
                )

            insights.append(
                _insight(
                    "drop",
                    GOOD,
                    "Em queda",
                    title,
                    body,
                    bars=[_bar(same_point, old, peak), _bar(unit["current"], value, peak, True)],
                )
            )

        # Total das despesas, só quando a mudança é relevante.
        if previous_total > 0 and abs(total - previous_total) >= MIN_DIFFERENCE:
            change = (total - previous_total) / previous_total
            peak = max(total, previous_total)

            if change <= -0.05 or change >= 0.10:
                if change <= -0.05:
                    tone = GOOD
                elif change >= 0.30:
                    tone = ALERT
                else:
                    tone = WARNING

                insights.append(
                    _insight(
                        "total_change",
                        tone,
                        "Despesas em queda" if change < 0 else "Despesas em alta",
                        f"Suas despesas {'caíram' if change < 0 else 'subiram'} {_percent(abs(change))}% em relação {versus}",
                        f"De {format_currency(previous_total)} para {format_currency(total)}: "
                        f"{format_currency(abs(total - previous_total))} {'a menos' if change < 0 else 'a mais'}.",
                        bars=[
                            _bar(same_point, previous_total, peak),
                            _bar(unit["current"], total, peak, True),
                        ],
                    )
                )

    # Categoria que vem subindo períodos seguidos (precisa dos dois anteriores).
    p1, p2, p3 = (_sum_by_category(bucket) for bucket in buckets[:3])

    rising = sorted(
        (
            c
            for c in spent
            if c not in (above_id, changed_id)
            and p2.get(c, 0) > 0
            and p1.get(c, 0) > p2[c]
            and spent[c] > p1[c]
            and spent[c] - p2[c] >= MIN_DIFFERENCE
            and spent[c] >= p2[c] * 1.10
        ),
        key=lambda c: spent[c] / p2[c],
        reverse=True,
    )

    if rising:
        category_id = rising[0]
        points = [
            *([(priors[2][0], p3[category_id])] if p3.get(category_id, 0) > 0 else []),
            (priors[1][0], p2[category_id]),
            (priors[0][0], p1[category_id]),
            (start, spent[category_id]),
        ]
        peak = max(value for _, value in points)

        insights.append(
            _insight(
                "trend",
                WARNING,
                "Tendência de alta",
                f"{names[category_id]} vem subindo há 3 {unit['plural']}",
                f"Subiu de {format_currency(p2[category_id])} para {format_currency(spent[category_id])} "
                f"nos últimos 3 {unit['plural']}. Vale rever esse gasto antes que vire hábito.",
                spark=[
                    {
                        "label": _short_label(period_type, when),
                        "value": format_currency(value),
                        "fraction": value / peak,
                        "highlighted": index == len(points) - 1,
                    }
                    for index, (when, value) in enumerate(points)
                ],
            )
        )

    # Margem até a média (ou quanto ficou abaixo dela).
    if has_history:
        below = sorted(
            (
                c
                for c in average
                if c in spent and average[c] > 0 and spent[c] <= average[c] * 0.9 and average[c] - spent[c] >= MIN_DIFFERENCE
            ),
            key=lambda c: average[c] - spent[c],
            reverse=True,
        )

        if below:
            category_id = below[0]
            value, mean = spent[category_id], average[category_id]
            gap = mean - value
            name = names[category_id]

            insights.append(
                _insight(
                    "below_average",
                    GOOD,
                    "Margem até a média" if ongoing else "Abaixo da média",
                    f"{name}: faltam {format_currency(gap)} para chegar à média"
                    if ongoing
                    else f"{name} ficou {format_currency(gap)} abaixo da média",
                    f"Você gastou {format_currency(value)} e a média da categoria {average_label} é {format_currency(mean)}."
                    + (" Esse é o espaço que ainda há antes de gastar mais do que costuma." if ongoing else ""),
                    progress=_progress(value / mean, f"{format_currency(value)} gastos", f"Média {format_currency(mean)}"),
                )
            )

    # Maior lançamento do período.
    if len(current) >= 3:
        biggest = max(current, key=lambda entry: entry.amount)
        share = biggest.amount / total

        if share >= 0.25:
            insights.append(
                _insight(
                    "largest_expense",
                    WARNING if share >= 0.35 else NEUTRAL,
                    "Maior despesa",
                    f"Uma única despesa pesa {_percent(share)}% do período",
                    f'"{biggest.title}", de {format_currency(biggest.amount)}, é o maior lançamento — '
                    f"{_percent(biggest.amount / spent[biggest.category_id])}% de tudo o que você gastou em {biggest.category}.",
                    progress=_progress(share, format_currency(biggest.amount), f"Total {format_currency(total)}"),
                )
            )

    # Dependência de uma única categoria, quando o insight de média já não a cobre.
    if len(spent) >= 2:
        top = max(spent, key=lambda category_id: spent[category_id])
        share = spent[top] / total

        if share >= 0.5 and top != above_id:
            insights.append(
                _insight(
                    "concentration",
                    NEUTRAL,
                    "Concentração",
                    f"{names[top]} concentra {_percent(share)}% das despesas",
                    f"{format_currency(spent[top])} de {format_currency(total)} no período. "
                    "Uma variação nessa categoria muda muito o seu total.",
                    progress=_progress(share, names[top], f"Total {format_currency(total)}"),
                )
            )

    # Despesas frente à receita do período.
    if income and income > 0:
        ratio = total / income
        left = income - total
        bars = [_bar("Receitas", income, max(income, total)), _bar("Despesas", total, max(income, total), True)]
        progress = _progress(ratio, f"Despesas {format_currency(total)}", f"Receitas {format_currency(income)}")

        if total > income:
            insights.append(
                _insight(
                    "savings",
                    ALERT,
                    "Despesas acima da receita",
                    f"{'Você está gastando' if ongoing else 'Você gastou'} {format_currency(total - income)} a mais do que recebeu",
                    f"As despesas somam {format_currency(total)} para {format_currency(income)} de receita "
                    f"({_percent(ratio)}% da receita).",
                    bars=bars,
                )
            )
        elif ratio >= 0.9:
            insights.append(
                _insight(
                    "savings",
                    WARNING,
                    "Pouca folga",
                    f"As despesas {'consomem' if ongoing else 'consumiram'} {_percent(ratio)}% da receita",
                    f"Sobram só {format_currency(left)} de {format_currency(income)} recebidos. "
                    "Qualquer imprevisto pode fechar o período no vermelho.",
                    progress=progress,
                )
            )
        elif left / income >= 0.2:
            insights.append(
                _insight(
                    "savings",
                    GOOD,
                    "Poupança",
                    f"{'Você está guardando' if ongoing else 'Você guardou'} {_percent(left / income)}% da receita",
                    f"{format_currency(left)} sobram de {format_currency(income)} recebidos "
                    f"depois de {format_currency(total)} em despesas.",
                    progress=progress,
                )
            )

    # Projeção do fechamento de um período em andamento.
    length = (end - start).days + 1
    elapsed = (today - start).days + 1

    if ongoing and length > 1 and 5 <= elapsed < length:
        projected = total / elapsed * length

        if has_history:
            mean_total = sum(sum(entry.amount for entry in bucket) for bucket in buckets) / active
            diff = projected - mean_total

            if abs(diff) >= MIN_DIFFERENCE and abs(diff) / mean_total >= 0.10:
                over_mean = diff > 0
                peak = max(projected, mean_total)

                insights.append(
                    _insight(
                        "projection",
                        (ALERT if diff / mean_total >= 0.30 else WARNING) if over_mean else GOOD,
                        "Projeção",
                        f"No ritmo atual, você fecha com {format_currency(projected)} em despesas",
                        f"Em {elapsed} dos {length} dias você gastou {format_currency(total)}. "
                        f"Isso aponta para {_percent(abs(diff) / mean_total)}% {'acima' if over_mean else 'abaixo'} "
                        f"da média total {average_label} ({format_currency(mean_total)}).",
                        bars=[_bar("Projeção", projected, peak, True), _bar("Média", mean_total, peak)],
                    )
                )

    # Dia da semana em que os gastos se concentram.
    if length >= 14 and len(current) >= 8:
        by_weekday = [0.0] * 7

        for entry in current:
            by_weekday[entry.date.weekday()] += entry.amount

        top_day = max(range(7), key=lambda day: by_weekday[day])
        share = by_weekday[top_day] / total

        if share >= 0.30:
            peak = by_weekday[top_day]

            insights.append(
                _insight(
                    "weekday",
                    NEUTRAL,
                    "Dia da semana",
                    f"{_WEEKDAYS[top_day]} concentram {_percent(share)}% das despesas",
                    f"{format_currency(by_weekday[top_day])} de {format_currency(total)} foram gastos em "
                    f"{_WEEKDAYS[top_day].lower()}. Se quiser economizar, vale olhar para esse dia primeiro.",
                    spark=[
                        {
                            "label": _WEEKDAY_SHORT[day],
                            "value": format_currency(by_weekday[day]),
                            "fraction": by_weekday[day] / peak,
                            "highlighted": day == top_day,
                        }
                        for day in _WEEKDAY_ORDER
                    ],
                )
            )

    # Despesas recorrentes que ainda vão cair no período.
    if ongoing:
        upcoming = _upcoming(recurring, start, end)
        upcoming_total = sum(item.amount for _, item in upcoming)

        if upcoming_total >= MIN_DIFFERENCE:
            biggest_when, biggest_item = max(upcoming, key=lambda pair: pair[1].amount)
            count = len(upcoming)

            insights.append(
                _insight(
                    "upcoming",
                    NEUTRAL,
                    "A vencer",
                    f"Ainda há {format_currency(upcoming_total)} em despesas recorrentes até o fim do período",
                    f"{count} lançamento{'s' if count > 1 else ''} programado{'s' if count > 1 else ''}; "
                    f"o maior é \"{biggest_item.title}\", de {format_currency(biggest_item.amount)}, "
                    f"em {biggest_when.strftime('%d/%m')}.",
                    progress=_progress(
                        total / (total + upcoming_total),
                        f"Gasto {format_currency(total)}",
                        f"Previsto {format_currency(total + upcoming_total)}",
                    ),
                )
            )

    insights.sort(key=lambda item: _TONE_RANK[item["tone"]])

    # Comparação com a média, da maior categoria para a menor.
    comparisons = []

    if has_history:
        comparisons = [
            {
                "name": names[category_id],
                "value": value,
                "average": average.get(category_id),
                "change": (value - average[category_id]) / average[category_id]
                if average.get(category_id, 0) > 0
                else None,
            }
            for category_id, value in sorted(spent.items(), key=lambda pair: pair[1], reverse=True)
        ]

    ids = {*spent, *average}

    def count(predicate):
        return sum(1 for category_id in ids if predicate(category_id))

    return {
        "insights": insights[:MAX_INSIGHTS],
        "comparisons": comparisons,
        "has_expenses": True,
        "has_history": has_history,
        "has_previous": has_previous,
        "history_periods": active,
        "average_label": average_label,
        "above_count": count(lambda c: average.get(c, 0) > 0 and spent.get(c, 0) > average[c] * 1.05) if has_history else 0,
        "below_count": count(lambda c: average.get(c, 0) > 0 and spent.get(c, 0) < average[c] * 0.95) if has_history else 0,
        "dropped_count": count(lambda c: before.get(c, 0) > 0 and spent.get(c, 0) < before[c] * 0.95) if has_previous else 0,
    }
