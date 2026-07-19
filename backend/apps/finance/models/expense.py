from .base import BaseFinancial
from apps.finance.manager import ExpenseManager


class Expense(BaseFinancial):

    objects: ExpenseManager = ExpenseManager()

    class Meta:
        db_table = "expenses"
