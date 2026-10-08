from django.db import models

from .base import BaseFinancial


class Income(BaseFinancial):

    class Meta:
        db_table = "incomes"
        indexes = [
            models.Index(fields=["family", "-date"], name="inc_family_date_idx"),
        ]