from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from django.conf import settings


class UploadRejected(Exception):
    """Arquivo recusado. A mensagem é genérica de propósito: nunca expõe trechos do conteúdo."""


@dataclass
class ParsedRow:
    direction: str
    amount: Decimal
    occurred_at: date
    description: str = ""
    external_id: str = ""
    kind: str = ""
    account_ref: str = ""
    source_category: str = ""
    counterparty: str = ""
    flag: str = ""


def validate_upload(content):
    if not content:
        raise UploadRejected("Arquivo vazio.")

    if len(content) > settings.IMPORT_MAX_FILE_BYTES:
        raise UploadRejected("Arquivo grande demais.")
