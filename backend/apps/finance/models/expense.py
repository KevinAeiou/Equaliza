from django.db import models

from .base import BaseFinancial
from apps.finance.manager import ExpenseManager


class Expense(BaseFinancial):

    objects: ExpenseManager = ExpenseManager()

    class Meta:
        db_table = "expenses"
        indexes = [
            models.Index(fields=["family", "-date"], name="exp_family_date_idx"),
        ]
