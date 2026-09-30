import calendar
from datetime import timedelta

from apps.finance.enums import RecurrenceFrequency


def occurrence_date(start, frequency, index):
    """Data da n-ésima ocorrência, sempre contada a partir da data inicial.

    Evita que um lançamento do dia 31 "escorregue" para o dia 28 após fevereiro.
    """
    if frequency == RecurrenceFrequency.WEEKLY:
        return start + timedelta(weeks=index)

    if frequency == RecurrenceFrequency.MONTHLY:
        months = start.month - 1 + index
        year, month = start.year + months // 12, months % 12 + 1
    else:
        year, month = start.year + index, start.month

    day = min(start.day, calendar.monthrange(year, month)[1])

    return start.replace(year=year, month=month, day=day)
