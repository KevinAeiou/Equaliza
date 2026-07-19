from django.db import models


class FinancialCategoryManager(models.Manager):

    def for_family(self, family):
        return self.filter(models.Q(family=family) | models.Q(family__isnull=True))

    def exists_by_name(self, *, family, category_type, name):
        return self.filter(
            family=family,
            type=category_type,
            name__iexact=name,
        ).exists()

    def exists_by_name_excluding(self, *, family, category_type, name, category):
        return (
            self.filter(
                family=family,
                type=category_type,
                name__iexact=name,
            )
            .exclude(pk=category.pk)
            .exists()
        )