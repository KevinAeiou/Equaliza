from django.db import models
from django.utils.translation import gettext_lazy as _
from model_utils.fields import AutoCreatedField, AutoLastModifiedField


class TimeStampedMixin(models.Model):
    created_at = AutoCreatedField(_("created_at"), db_index=True, null=True)
    updated_at = AutoLastModifiedField(_("updated_at"), db_index=True, null=True)

    class Meta:
        abstract = True