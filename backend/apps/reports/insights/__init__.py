"""Insights sobre as despesas de um período.

Cálculo puro (sem acesso ao banco): recebe as despesas já carregadas e devolve o relatório
que o dashboard exibe. Cada insight sai de uma regra em `rules/` e só aparece quando há
dados para sustentá-lo. Valores monetários são `Decimal`.
"""

from .builder import build_insights
from .constants import (
    ALERT,
    DAY,
    GOOD,
    INSIGHT_HISTORY,
    MONTH,
    NEUTRAL,
    PERIOD,
    PERIOD_TYPES,
    WARNING,
    WEEK,
    YEAR,
)
from .context import Entry, Recurring
from .formatting import format_currency
from .periods import insights_window, shift_period

__all__ = [
    "ALERT",
    "DAY",
    "Entry",
    "GOOD",
    "INSIGHT_HISTORY",
    "MONTH",
    "NEUTRAL",
    "PERIOD",
    "PERIOD_TYPES",
    "Recurring",
    "WARNING",
    "WEEK",
    "YEAR",
    "build_insights",
    "format_currency",
    "insights_window",
    "shift_period",
]
