from django.db import models

from apps.core.models import BaseModel
from apps.families.managers import FamilyManager
from apps.families.utils import current_month_start


class Family(BaseModel):
    name = models.CharField(max_length=150, verbose_name="Nome")

    settlement_start = models.DateField(
        default=current_month_start,
        verbose_name="Início do acerto de contas",
        help_text="Primeiro dia do mês a partir do qual os acertos entre membros contam.",
    )

    objects: FamilyManager = FamilyManager()

    class Meta:
        db_table = "families"

    def __str__(self):
        return self.name
