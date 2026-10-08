"""Constantes do cálculo de insights: limites, tons, tipos de período e textos."""

from decimal import Decimal

# Quantos períodos anteriores entram na média.
INSIGHT_HISTORY = 6

# Períodos anteriores com despesas necessários para falar em "média".
MIN_HISTORY_PERIODS = 2

# Diferenças menores que isso (em reais) são ruído e não geram insight.
MIN_DIFFERENCE = Decimal("30")

MAX_INSIGHTS = 8

DAY, WEEK, MONTH, YEAR, PERIOD = "DAY", "WEEK", "MONTH", "YEAR", "PERIOD"
PERIOD_TYPES = (DAY, WEEK, MONTH, YEAR, PERIOD)

ALERT, WARNING, NEUTRAL, GOOD = "alert", "warning", "neutral", "good"
TONE_RANK = {ALERT: 0, WARNING: 1, NEUTRAL: 2, GOOD: 3}

UNITS = {
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

MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

# Segunda = 0 (como em date.weekday()); a exibição começa no domingo.
WEEKDAYS = ["Segundas-feiras", "Terças-feiras", "Quartas-feiras", "Quintas-feiras", "Sextas-feiras", "Sábados", "Domingos"]
WEEKDAY_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
WEEKDAY_ORDER = [6, 0, 1, 2, 3, 4, 5]
