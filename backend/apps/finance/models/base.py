from django.db import models
from django.utils import timezone

from apps.families.models import Family
from apps.finance.constants import DESCRIPTION_MAX_LENGTH
from apps.finance.models import FinancialCategory
from apps.core.models import BaseModel


class BaseFinancial(BaseModel):
    family = models.ForeignKey(Family, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(default=timezone.localdate)
    description = models.TextField(
        max_length=DESCRIPTION_MAX_LENGTH,
        blank=True,
    )
    category = models.ForeignKey(FinancialCategory, on_delete=models.PROTECT)

    class Meta:
        abstract = True
