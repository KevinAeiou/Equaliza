from django.db import models
from django.utils.translation import gettext_lazy as _


class Avatar(models.TextChoices):
    AVATAR_1 = "avatar-1", _("Avatar 1")
    AVATAR_2 = "avatar-2", _("Avatar 2")
    AVATAR_3 = "avatar-3", _("Avatar 3")
    AVATAR_4 = "avatar-4", _("Avatar 4")
    AVATAR_5 = "avatar-5", _("Avatar 5")
    AVATAR_6 = "avatar-6", _("Avatar 6")
    AVATAR_7 = "avatar-7", _("Avatar 7")
