from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.core.models import BaseModel
from apps.users.enuns import Avatar
from .manager import UserManager


class User(BaseModel, AbstractUser):
    username = None

    email = models.EmailField(
        unique=True,
        verbose_name="E-mail",
    )

    current_family = models.ForeignKey(
        "families.Family",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    avatar = models.CharField(
        max_length=30,
        choices=Avatar.choices,
        default=Avatar.AVATAR_1,
    )
        
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects: UserManager = UserManager()

    class Meta:
        db_table = "users"
