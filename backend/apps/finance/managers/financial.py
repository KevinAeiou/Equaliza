from django.db import models


class FinancialManager(models.Manager):
    """Manager compartilhado por receitas e despesas."""

    def for_family(self, family):
        return self.filter(family=family)
