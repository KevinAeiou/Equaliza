from django.conf import settings
from django.db import models

from apps.core.models import BaseModel
from apps.families.managers import FamilyManager

class Family(BaseModel):
    name = models.CharField(max_length=150, verbose_name="Nome")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_families",
        verbose_name="Criado por",
    )

    objects: FamilyManager = FamilyManager()

    class Meta:
        db_table = "families"

    def __str__(self):
        return self.name
