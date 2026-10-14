"""Extrato da conta do C6 Bank em PDF (texto já extraído).

Layout conferido em um extrato real (2026-10): cada lançamento tem `Data lançamento`, `Data contábil`,
`Tipo`, `Descrição` e `Valor` (`-R$ 0,04` nas saídas, `R$ 27,00` nas entradas); entre os dias há linhas
`Saldo do dia`, e o cabeçalho de cada mês traz os totais de `Entradas` e `Saídas`, usados para conferir
a leitura. O texto é normalizado (espaços e quebras de linha viram um espaço), então não importa se o
extrator do PDF entrega uma linha por lançamento ou uma por célula.

O nome do titular, o CPF e a conta do cabeçalho são ignorados; só os 4 últimos dígitos da conta são lidos.
"""

import re
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from apps.imports.enums import Direction
from apps.imports.parsed import ParsedRow
from apps.imports.parsers.errors import UnsupportedFormat
from apps.imports.parsers.flags import detect_flag

MONTHS = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "marco": 3, "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12,
}

# Tipos conhecidos, do mais longo para o mais curto. Um tipo novo não quebra a leitura: ele só
# fica junto da descrição.
KINDS = (
    "Débito Automático", "Débito de Cartão", "Entrada PIX", "Saída PIX", "Entrada TED", "Saída TED",
    "Outros gastos", "Transferência", "Rendimento", "Pagamento", "Depósito", "Resgate", "Estorno",
    "Tarifa", "Saque", "Compra", "Boleto", "Salário",
)

MONEY = r"-?\s?R\$\s?[\d.]+,\d{2}"
ROW = re.compile(
    rf"(?<![\d/])(\d{{2}})/(\d{{2}})(?!/) (\d{{2}}/\d{{2}})(?!/) (.+?) ({MONEY})(?= |$)"
)
PERIOD = re.compile(
    r"Período\W{0,3}(\d{1,2}) de (\w+) de (\d{4}) até (\d{1,2}) de (\w+) de (\d{4})", re.IGNORECASE
)
MONTH_TOTALS = re.compile(
    rf"({'|'.join(MONTHS)}) (\d{{4}}) \([^)]*\) .*?Entradas:\s*R\$\s?([\d.]+,\d{{2}}).*?Saídas:\s*R\$\s?([\d.]+,\d{{2}})",
    re.IGNORECASE,
)
ACCOUNT = re.compile(r"Conta:\s*(\d+)")


@dataclass
class StatementResult:
    rows: list = field(default_factory=list)
    account_ref: str = ""
    period_start: date | None = None
    period_end: date | None = None
    # Totais do cabeçalho do PDF (None se não aparecerem) e o que foi lido das linhas.
    pdf_in: Decimal | None = None
    pdf_out: Decimal | None = None
    parsed_in: Decimal = Decimal("0")
    parsed_out: Decimal = Decimal("0")

    @property
    def matches(self):
        """Os totais lidos batem com os do PDF? `None` quando o PDF não traz totais para conferir."""
        if self.pdf_in is None or self.pdf_out is None:
            return None

        return self.pdf_in == self.parsed_in and self.pdf_out == self.parsed_out


def is_c6_statement(normalized):
    lowered = normalized.lower()

    return "c6" in lowered and "extrato" in lowered and "data contábil" in lowered


def money(value):
    return Decimal(re.sub(r"[^\d,]", "", value).replace(",", "."))


def split_kind(rest):
    for kind in KINDS:
        if rest.lower().startswith(kind.lower() + " "):
            return kind, rest[len(kind):].strip()

    return "", rest


def parse_period(text):
    match = PERIOD.search(text)

    if not match:
        return None, None

    d1, m1, y1, d2, m2, y2 = match.groups()

    try:
        return (
            date(int(y1), MONTHS[m1.lower()], int(d1)),
            date(int(y2), MONTHS[m2.lower()], int(d2)),
        )
    except (KeyError, ValueError):
        return None, None


def resolve_date(day, month, start, end):
    """`dd/mm` sem ano: escolhe o ano em que a data cai dentro do período do extrato."""
    for year in sorted({start.year, end.year}):
        try:
            candidate = date(year, month, day)
        except ValueError:
            continue

        if start <= candidate <= end:
            return candidate

    return None


def parse_c6_statement_text(text):
    normalized = re.sub(r"\s+", " ", text)

    if not is_c6_statement(normalized):
        raise UnsupportedFormat("Este PDF não parece ser um extrato do C6.")

    start, end = parse_period(normalized)

    if not start or not end:
        raise UnsupportedFormat("Não foi possível identificar o período do extrato.")

    result = StatementResult(period_start=start, period_end=end)
    account = ACCOUNT.search(normalized)
    result.account_ref = account.group(1)[-4:] if account else ""

    for match in ROW.finditer(normalized):
        day, month, _accounting, rest, value = match.groups()
        occurred = resolve_date(int(day), int(month), start, end)

        if occurred is None:
            continue

        kind, description = split_kind(rest.strip())
        amount = money(value)
        debit = value.lstrip().startswith("-")

        result.rows.append(
            ParsedRow(
                direction=Direction.DEBIT if debit else Direction.CREDIT,
                amount=amount,
                occurred_at=occurred,
                description=description or kind,
                kind=kind,
                account_ref=result.account_ref,
                flag=detect_flag(description),
            )
        )

        if debit:
            result.parsed_out += amount
        else:
            result.parsed_in += amount

    totals = MONTH_TOTALS.findall(normalized)

    if totals:
        result.pdf_in = sum((money(item[2]) for item in totals), Decimal("0"))
        result.pdf_out = sum((money(item[3]) for item in totals), Decimal("0"))

    if not result.rows:
        raise UnsupportedFormat("Nenhum lançamento foi encontrado no PDF.")

    return result
