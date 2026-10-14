from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.imports.enums import ImportSource
from apps.imports.models import CsvMapping, ImportBatch


class ImportBatchSerializer(serializers.ModelSerializer):
    pending_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ImportBatch
        fields = (
            "id", "source", "format", "period_start", "period_end",
            "rows_total", "rows_new", "rows_duplicated", "pending_count", "created_at",
        )
        read_only_fields = fields


@extend_schema_field(OpenApiTypes.INT)
class OwnMappingField(serializers.PrimaryKeyRelatedField):
    def get_queryset(self):
        return CsvMapping.objects.filter(owner=self.context["request"].user)


class UploadSerializer(serializers.Serializer):
    file = serializers.FileField(allow_empty_file=False)
    source = serializers.ChoiceField(choices=ImportSource.choices)
    # Senha do arquivo: só no corpo, usada em memória e nunca guardada.
    password = serializers.CharField(
        required=False, allow_blank=True, max_length=128, trim_whitespace=False, write_only=True
    )
    mapping = OwnMappingField(required=False, allow_null=True)
