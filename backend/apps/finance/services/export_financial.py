import csv
import io
from decimal import Decimal
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

HEADER = ("Data", "Categoria", "Descrição", "Valor", "Registrado por")
FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def neutralize_formula(value):
    """Prefixa com apóstrofo o texto que uma planilha interpretaria como fórmula."""
    text = str(value or "")

    return f"'{text}" if text.startswith(FORMULA_PREFIXES) else text


def author_name(obj):
    user = obj.created_by

    return (user.get_full_name() or user.email) if user else ""


class ExportFinancialService:
    """Gera CSV e PDF dos lançamentos já filtrados."""

    @staticmethod
    def rows(queryset):
        for obj in queryset:
            yield (
                obj.date.strftime("%d/%m/%Y"),
                obj.category.name,
                obj.description,
                obj.amount,
                author_name(obj),
            )

    @classmethod
    def to_csv(cls, queryset):
        buffer = io.StringIO()
        writer = csv.writer(buffer, delimiter=";")
        writer.writerow(HEADER)

        for date, category, description, amount, author in cls.rows(queryset):
            writer.writerow(
                (
                    date,
                    neutralize_formula(category),
                    neutralize_formula(description),
                    f"{amount:.2f}".replace(".", ","),
                    neutralize_formula(author),
                )
            )

        # BOM para o Excel reconhecer UTF-8.
        return ("﻿" + buffer.getvalue()).encode("utf-8")

    @classmethod
    def to_pdf(cls, queryset, title):
        styles = getSampleStyleSheet()
        cell = styles["BodyText"]
        total = Decimal("0")
        data = [list(HEADER)]

        for date, category, description, amount, author in cls.rows(queryset):
            total += amount
            data.append(
                [
                    date,
                    Paragraph(escape(category), cell),
                    Paragraph(escape(description), cell),
                    f"R$ {amount:.2f}".replace(".", ","),
                    Paragraph(escape(author), cell),
                ]
            )

        table = Table(data, repeatRows=1, colWidths=[60, 90, 190, 70, 90])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ALIGN", (3, 0), (3, -1), "RIGHT"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                ]
            )
        )

        buffer = io.BytesIO()
        SimpleDocTemplate(buffer, pagesize=A4, title=title).build(
            [
                Paragraph(escape(title), styles["Title"]),
                Paragraph(f"Total: R$ {total:.2f}".replace(".", ","), styles["Normal"]),
                Spacer(1, 12),
                table,
            ]
        )

        return buffer.getvalue()
