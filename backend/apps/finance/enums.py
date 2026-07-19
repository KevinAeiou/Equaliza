from django.db import models
from django.utils.translation import gettext_lazy as _


class CategoryType(models.TextChoices):
    EXPENSE = "EXPENSE", _("Despesa")
    INCOME = "INCOME", _("Receita")
