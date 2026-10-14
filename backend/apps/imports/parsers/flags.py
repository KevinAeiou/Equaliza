import re

from apps.imports.enums import PendingFlag

CARD_PAYMENT = re.compile(
    r"(?:pag(?:to|amento)?|pgto)\.?\s+(?:de\s+)?fat(?:ura)?\b|fatura\s+(?:de\s+)?cart", re.IGNORECASE
)


def detect_flag(description):
    """Sinaliza o que provavelmente duplica outra linha; quem decide é sempre o usuário."""
    return PendingFlag.CARD_PAYMENT if CARD_PAYMENT.search(description or "") else ""
