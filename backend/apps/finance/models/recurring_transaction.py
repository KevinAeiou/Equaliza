from django.db import models

from apps.core.models import BaseModel
from apps.families.models import Family
from apps.finance.constants import DESCRIPTION_MAX_LENGTH
from apps.finance.enums import CategoryType, RecurrenceFrequency
from apps.finance.manager import RecurringTransactionManager
from apps.finance.models import FinancialCategory


class RecurringTransaction(BaseModel):
    family = models.ForeignKey(Family, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=CategoryType.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(
        max_length=DESCRIPTION_MAX_LENGTH,
        blank=True,
    )
    category = models.ForeignKey(
        FinancialCategory,
        on_delete=models.PROTECT,
        related_name="recurring_transactions",
    )
    frequency = models.CharField(max_length=10, choices=RecurrenceFrequency.choices)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    next_date = models.DateField()
    generated_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    objects: RecurringTransactionManager = RecurringTransactionManager()

    class Meta:
        db_table = "recurring_transactions"
        indexes = [
            models.Index(
                fields=["family", "is_active", "next_date"],
                name="rec_family_active_next_idx",
            ),
        ]
