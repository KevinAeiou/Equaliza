from django.db import models
from django.utils.translation import gettext_lazy as _


class SettlementStatus(models.TextChoices):
    ACTIVE = "ACTIVE", _("Ativo")
    CANCELLED = "CANCELLED", _("Estornado")
