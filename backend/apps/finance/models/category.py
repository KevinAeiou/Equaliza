from django.db import models

from apps.families.models import Family
from apps.finance.enums import CategoryType
from apps.finance.manager import FinancialCategoryManager


class FinancialCategory(models.Model):
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=CategoryType.choices)
    family = models.ForeignKey(Family, null=True, blank=True, on_delete=models.CASCADE)

    objects: FinancialCategoryManager = FinancialCategoryManager()

    class Meta:
        db_table = "categories"

        constraints = [
            models.UniqueConstraint(
                fields=["family", "type", "name"],
                name="unique_financial_category_per_family",
            ),
        ]

    @property
    def is_used(self):
        return (
            self.expenses.exists()  # pyright: ignore[reportAttributeAccessIssue]
            or self.incomes.exists()  # pyright: ignore[reportAttributeAccessIssue]
        )
