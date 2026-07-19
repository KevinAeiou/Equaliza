from .base import BaseFinancial
from apps.finance.manager import IncomeManager


class Income(BaseFinancial):

    objects: IncomeManager = IncomeManager()

    class Meta:
        db_table = "incomes"