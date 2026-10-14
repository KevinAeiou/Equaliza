"""Leitor de OFX (extrato de conta e de cartão), em versão 1 (SGML) e 2 (XML).

É um tokenizador próprio e restrito, e não um parser de XML: DTD, entidades e instruções de
processamento nunca são interpretadas, então XXE e "bilhão de risadas" não têm como acontecer.
Só as tags de interesse são lidas; o resto é ignorado.
"""

import re
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal, InvalidOperation

from apps.imports.enums import Direction, ImportSource
from apps.imports.parsers.errors import ParseError
from apps.imports.parsers.flags import detect_flag
from apps.imports.parsers.text import decode_text
from apps.imports.parsed import ParsedRow

MAX_TAGS = 200_000
MAX_VALUE_LENGTH = 500

TAG = re.compile(r"<(/?)([A-Za-z0-9_.]+)>([^<]*)")
BASIC_ENTITIES = {"&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'"}
ENTITY = re.compile(r"&(?:amp|lt|gt|quot|apos);")


OfxParseError = ParseError


@dataclass
class ParseResult:
    rows: list = field(default_factory=list)
    source_hint: str | None = None


def looks_like_ofx(content):
    head = content[:2048].lstrip(b"\xef\xbb\xbf \t\r\n").upper()

    return head.startswith(b"OFXHEADER") or b"<OFX>" in content[:4096].upper()


def unescape(value):
    return ENTITY.sub(lambda match: BASIC_ENTITIES[match.group(0)], value).strip()[:MAX_VALUE_LENGTH]


def parse_date(value):
    digits = re.match(r"\d{8}", value)

    if not digits:
        raise OfxParseError("Data inválida no arquivo.")

    try:
        return date(int(value[:4]), int(value[4:6]), int(value[6:8]))
    except ValueError:
        raise OfxParseError("Data inválida no arquivo.") from None


def parse_amount(value):
    text = value.replace(" ", "")

    # Alguns bancos brasileiros usam vírgula decimal.
    if "," in text:
        text = text.replace(".", "").replace(",", ".")

    try:
        amount = Decimal(text)
    except InvalidOperation:
        raise OfxParseError("Valor inválido no arquivo.") from None

    if not amount.is_finite():
        raise OfxParseError("Valor inválido no arquivo.")

    return amount


def parse_ofx(content, invert_sign=False, max_rows=None):
    """Lê o OFX e devolve as linhas.

    `invert_sign` vale para os emissores que registram a compra no cartão como valor positivo.
    """
    text = decode_text(content)
    start = text.upper().find("<OFX>")

    if start < 0:
        raise OfxParseError("Arquivo OFX inválido.")

    result = ParseResult()
    account_ref = ""
    current = None
    in_transaction = False
    tags = 0

    for match in TAG.finditer(text, start):
        tags += 1

        if tags > MAX_TAGS:
            raise OfxParseError("Arquivo OFX grande demais.")

        closing, name, raw = match.groups()
        name = name.upper()
        value = unescape(raw)

        if name == "STMTTRN":
            if closing:
                if in_transaction:
                    result.rows.append(build_row(current, account_ref, invert_sign))
                    if max_rows is not None and len(result.rows) > max_rows:
                        raise OfxParseError("Arquivo com linhas demais.")
                in_transaction = False
            else:
                current = {}
                in_transaction = True
        elif closing:
            continue
        elif name == "CREDITCARDMSGSRSV1":
            result.source_hint = ImportSource.CARD_INVOICE
        elif name == "BANKMSGSRSV1":
            result.source_hint = ImportSource.STATEMENT
        elif name == "ACCTID" and not in_transaction:
            account_ref = re.sub(r"\D", "", value)[-4:]
        elif in_transaction and value:
            current.setdefault(name, value)

    return result


def build_row(fields, account_ref, invert_sign):
    if not all(key in fields for key in ("DTPOSTED", "TRNAMT")):
        raise OfxParseError("Transação incompleta no arquivo.")

    amount = parse_amount(fields["TRNAMT"])

    if invert_sign:
        amount = -amount

    name = fields.get("NAME", "")
    memo = fields.get("MEMO", "")
    description = memo or name

    return ParsedRow(
        direction=Direction.CREDIT if amount > 0 else Direction.DEBIT,
        amount=abs(amount),
        occurred_at=parse_date(fields["DTPOSTED"]),
        description=description,
        external_id=fields.get("FITID", ""),
        kind=fields.get("TRNTYPE", ""),
        account_ref=account_ref,
        counterparty=name if memo and name != memo else "",
        flag=detect_flag(description),
    )
