from django.db import models


class IncomeManager(models.Manager):

    def for_family(self, family):

        return self.filter(family=family)
