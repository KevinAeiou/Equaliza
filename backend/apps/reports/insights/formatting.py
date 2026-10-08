"""Valores monetários e blocos de saída (barras, progresso, insight) do relatório."""

from decimal import ROUND_HALF_UP, Decimal

ZERO = Decimal("0")
CENTS = Decimal("0.01")


def money(value):
    """Converte para Decimal sem passar pelo erro binário do float (`Decimal(str(...))`)."""
    if isinstance(value, Decimal):
        return value

    return Decimal(str(value))


def format_currency(value):
    value = money(value)
    text = f"{abs(value).quantize(CENTS, ROUND_HALF_UP):,.2f}".replace(",", "_").replace(".", ",").replace("_", ".")

    return f"{'-' if value < 0 else ''}R$\xa0{text}"


def percent(ratio):
    """Razão em porcentagem inteira, arredondando meio para cima."""
    return int((ratio * 100).to_integral_value(ROUND_HALF_UP))


def bar(label, value, peak, highlighted=False):
    return {
        "label": label,
        "value": format_currency(value),
        "fraction": float(value / peak) if peak else 0,
        "highlighted": highlighted,
    }


def progress(fraction, start, end):
    return {"fraction": float(min(max(fraction, 0), 1)), "start": start, "end": end}


def spark_point(label, value, peak, highlighted):
    return {
        "label": label,
        "value": format_currency(value),
        "fraction": float(value / peak),
        "highlighted": highlighted,
    }


def insight(kind, tone, tag, title, body, bars=None, progress=None, spark=None, note=None):
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


def empty_report():
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
