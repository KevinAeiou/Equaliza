from datetime import date

from django.core.exceptions import ValidationError


def parse_month(value):
    """'YYYY-MM' → primeiro dia do mês."""
    try:
        year, month = str(value).split("-")
        return date(int(year), int(month), 1)
    except (ValueError, TypeError):
        raise ValidationError("Mês inválido. Use o formato AAAA-MM.") from None


def add_months(month, delta):
    index = month.year * 12 + (month.month - 1) + delta

    return date(index // 12, index % 12 + 1, 1)


def month_range(start, end):
    """Todos os meses de `start` a `end`, inclusive (primeiros dias)."""
    months = []
    current = start

    while current <= end:
        months.append(current)
        current = add_months(current, 1)

    return months
