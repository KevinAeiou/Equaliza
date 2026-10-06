from django.db import models

from .base import BaseFinancial
from apps.finance.manager import IncomeManager


class Income(BaseFinancial):

    objects: IncomeManager = IncomeManager()

    class Meta:
        db_table = "incomes"
        indexes = [
            models.Index(fields=["family", "-date"], name="inc_family_date_idx"),
        ]