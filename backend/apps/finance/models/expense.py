from django.db import models

from .base import BaseFinancial


class Expense(BaseFinancial):

    class Meta:
        db_table = "expenses"
        indexes = [
            models.Index(fields=["family", "-date"], name="exp_family_date_idx"),
        ]
