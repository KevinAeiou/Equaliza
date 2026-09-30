from django.db import models
from django.utils.translation import gettext_lazy as _


class CategoryType(models.TextChoices):
    EXPENSE = "EXPENSE", _("Despesa")
    INCOME = "INCOME", _("Receita")


class RecurrenceFrequency(models.TextChoices):
    WEEKLY = "WEEKLY", _("Semanal")
    MONTHLY = "MONTHLY", _("Mensal")
    YEARLY = "YEARLY", _("Anual")
