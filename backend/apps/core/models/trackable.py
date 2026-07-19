from django.db import models
from django.conf import settings

from .timestamp import TimeStampedMixin
from apps.core.current_user import get_current_user


class TrackableMixin(TimeStampedMixin):
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        db_column="created_by",
        related_name="created_%(class)s_set",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        db_column="updated_by",
        related_name="updated_%(class)s_set",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        user = get_current_user()

        if user and user.is_authenticated:
            if self._state.adding and self.created_by is None:
                self.created_by = user

            self.updated_by = user

        super().save(*args, **kwargs)