"""Leitor de CSV de extratos e faturas: modelos prontos por banco e mapeamento do usuário."""

import csv
import io
import re
import unicodedata
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation

from apps.imports.enums import Direction, ImportSource
from apps.imports.parsers.errors import NeedsMapping, ParseError
from apps.imports.parsers.flags import detect_flag
from apps.imports.parsers.text import decode_text
from apps.imports.parsed import ParsedRow

MAX_COLUMNS = 50
MAX_FIELD_LENGTH = 500
DELIMITERS = (";", ",", "\t")


def normalize(name):
    """Minúsculas, sem acento e sem espaços nas pontas: o cabeçalho muda de grafia entre bancos."""
    text = unicodedata.normalize("NFKD", name or "").encode("ascii", "ignore").decode()

    return re.sub(r"\s+", " ", text).strip().lower()


@dataclass(frozen=True)
class CsvLayout:
    name: str
    date: str
    amount: str
    description: str
    date_format: str = "%d/%m/%Y"
    decimal: str = "COMMA"
    debit_is_negative: bool = True
    delimiter: str = ""
    source: str | None = None
    external_id: str = ""
    account: str = ""
    category: str = ""
    installment: str = ""

    @property
    def required(self):
        return {self.date, self.amount, self.description}


# Modelos conferidos só com a documentação e arquivos sintéticos. O sinal e o separador reais
# do C6 e do Nubank (cartão) serão confirmados com arquivos reais na etapa 5.1.
KNOWN_LAYOUTS = (
    CsvLayout(
        name="Nubank (extrato)",
        date="data", amount="valor", description="descricao", external_id="identificador",
        decimal="DOT", source=ImportSource.STATEMENT,
    ),
    CsvLayout(
        name="Nubank (fatura)",
        date="date", amount="amount", description="title", category="category",
        date_format="%Y-%m-%d", decimal="DOT", debit_is_negative=False,
        source=ImportSource.CARD_INVOICE,
    ),
    CsvLayout(
        name="C6 (fatura)",
        date="data de compra", amount="valor (em r$)", description="descricao",
        account="final do cartao", category="categoria", installment="parcela",
        debit_is_negative=False, source=ImportSource.CARD_INVOICE,
    ),
)


def detect_delimiter(header_line, layout=None):
    if layout and layout.delimiter:
        return layout.delimiter

    return max(DELIMITERS, key=header_line.count)


def parse_amount(value, decimal):
    text = re.sub(r"[^\d,.\-+()]", "", value or "")
    negative = text.startswith("-") or (text.startswith("(") and text.endswith(")"))
    text = text.strip("-+()")

    if decimal == "COMMA":
        text = text.replace(".", "").replace(",", ".")
    else:
        text = text.replace(",", "")

    try:
        amount = Decimal(text)
    except InvalidOperation:
        raise ParseError("Valor inválido no arquivo.") from None

    return -amount if negative else amount


def parse_date(value, date_format):
    try:
        return datetime.strptime((value or "").strip(), date_format).date()
    except ValueError:
        raise ParseError("Data inválida no arquivo.") from None


def read_table(text, delimiter):
    reader = csv.reader(io.StringIO(text), delimiter=delimiter)
    headers = None

    for fields in reader:
        if not any(field.strip() for field in fields):
            continue

        if headers is None:
            if len(fields) > MAX_COLUMNS:
                raise ParseError("Arquivo com colunas demais.")
            headers = [normalize(field) for field in fields]
            continue

        yield headers, fields


def find_layout(headers, layouts):
    columns = set(headers)

    return next((layout for layout in layouts if layout.required <= columns), None)


def parse_csv(content, layout=None, max_rows=None):
    """Lê o CSV. Sem `layout`, procura um modelo pronto pelo cabeçalho; sem nenhum, pede mapeamento."""
    text = decode_text(content)
    first_line = next((line for line in text.splitlines() if line.strip()), "")

    if not first_line:
        raise ParseError("Arquivo vazio.")

    delimiter = detect_delimiter(first_line, layout)

    if layout is None:
        headers = next(csv.reader([first_line], delimiter=delimiter))
        layout = find_layout([normalize(header) for header in headers], KNOWN_LAYOUTS)

        if layout is None:
            raise NeedsMapping([header.strip()[:100] for header in headers[:MAX_COLUMNS]])

    rows = []

    for headers, fields in read_table(text, delimiter):
        if not layout.required <= set(headers):
            raise NeedsMapping([header[:100] for header in headers])

        record = dict(zip(headers, (field.strip()[:MAX_FIELD_LENGTH] for field in fields)))
        rows.append(build_row(record, layout))

        if max_rows is not None and len(rows) > max_rows:
            raise ParseError("Arquivo com linhas demais.")

    if not rows:
        raise ParseError("Arquivo sem transações.")

    return layout, rows


def build_row(record, layout):
    amount = parse_amount(record.get(layout.amount), layout.decimal)
    is_debit = amount < 0 if layout.debit_is_negative else amount > 0
    description = record.get(layout.description, "")
    installment = record.get(layout.installment, "") if layout.installment else ""

    if installment and normalize(installment) not in ("unica", "unico", ""):
        description = f"{description} ({installment})".strip()

    return ParsedRow(
        direction=Direction.DEBIT if is_debit else Direction.CREDIT,
        amount=abs(amount),
        occurred_at=parse_date(record.get(layout.date), layout.date_format),
        description=description,
        external_id=record.get(layout.external_id, "") if layout.external_id else "",
        account_ref=re.sub(r"\D", "", record.get(layout.account, ""))[-4:] if layout.account else "",
        source_category=record.get(layout.category, "") if layout.category else "",
        flag=detect_flag(description),
    )
