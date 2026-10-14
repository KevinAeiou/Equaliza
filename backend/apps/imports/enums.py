from django.db import models
from django.utils.translation import gettext_lazy as _


class ImportSource(models.TextChoices):
    STATEMENT = "STATEMENT", _("Extrato bancário")
    CARD_INVOICE = "CARD_INVOICE", _("Fatura de cartão")


class ImportFormat(models.TextChoices):
    OFX = "OFX", "OFX"
    CSV = "CSV", "CSV"
    PDF = "PDF", "PDF"


class Direction(models.TextChoices):
    DEBIT = "DEBIT", _("Débito")
    CREDIT = "CREDIT", _("Crédito")


class PendingStatus(models.TextChoices):
    PENDING = "PENDING", _("Pendente")
    IMPORTED = "IMPORTED", _("Registrada")
    DISMISSED = "DISMISSED", _("Lida")
    EXPIRED = "EXPIRED", _("Expirada")


class PendingFlag(models.TextChoices):
    CARD_PAYMENT = "CARD_PAYMENT", _("Provável pagamento de fatura")
    POSSIBLE_DUPLICATE = "POSSIBLE_DUPLICATE", _("Possível duplicidade")
