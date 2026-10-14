from django.conf import settings
from django.db import models

from apps.imports.enums import ImportFormat, ImportSource


class ImportBatch(models.Model):
    """Um arquivo enviado. Guarda só contagens e o hash do conteúdo, nunca o arquivo nem o nome dele."""

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="import_batches"
    )
    source = models.CharField(max_length=20, choices=ImportSource.choices)
    format = models.CharField(max_length=10, choices=ImportFormat.choices)
    file_hash = models.CharField(max_length=64)
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    rows_total = models.PositiveIntegerField(default=0)
    rows_new = models.PositiveIntegerField(default=0)
    rows_duplicated = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ("-created_at", "-id")
