from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from django.conf import settings
from rest_framework import serializers

from apps.imports.enums import Direction, ImportSource
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


class PdfPreviewRequestSerializer(serializers.Serializer):
    file = serializers.FileField(allow_empty_file=False)
    password = serializers.CharField(
        required=False, allow_blank=True, max_length=128, trim_whitespace=False, write_only=True
    )


class StatementRowSerializer(serializers.Serializer):
    date = serializers.DateField()
    description = serializers.CharField(allow_blank=True, max_length=500)
    kind = serializers.CharField(allow_blank=True, required=False, max_length=60)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    direction = serializers.ChoiceField(choices=Direction.choices)


class PdfPreviewSerializer(serializers.Serializer):
    """Linhas lidas do PDF para revisão; nada foi gravado. `matches` é nulo se o PDF não traz totais."""

    rows = StatementRowSerializer(many=True)
    account_ref = serializers.CharField()
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    matches = serializers.BooleanField(allow_null=True)
    parsed_in = serializers.DecimalField(max_digits=12, decimal_places=2)
    parsed_out = serializers.DecimalField(max_digits=12, decimal_places=2)
    pdf_in = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True)
    pdf_out = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True)


class PdfConfirmSerializer(serializers.Serializer):
    account_ref = serializers.RegexField(r"^\d{0,4}$", required=False, allow_blank=True)
    rows = StatementRowSerializer(many=True, allow_empty=False, max_length=settings.IMPORT_MAX_ROWS)
