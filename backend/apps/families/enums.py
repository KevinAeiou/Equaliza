from django.db import models
from django.utils.translation import gettext_lazy as _


class FamilyRole(models.TextChoices):
    OWNER = "OWNER", _("Responsável")
    ADMIN = "ADMIN", _("Administrador")
    MEMBER = "MEMBER", _("Membro")