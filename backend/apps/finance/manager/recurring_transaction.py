from django.db import models


class RecurringTransactionManager(models.Manager):

    def for_family(self, family):

        return self.filter(family=family)

    def due(self, today):

        return self.filter(is_active=True, next_date__lte=today)
