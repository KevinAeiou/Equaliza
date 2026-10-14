from rest_framework import serializers

from apps.imports.models import CsvMapping
from apps.imports.parsers import normalize


class CsvMappingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CsvMapping
        fields = (
            "id", "name", "delimiter", "date_column", "amount_column", "description_column",
            "date_format", "decimal_separator", "debit_is_negative", "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate(self, attrs):
        columns = [normalize(attrs[key]) for key in ("date_column", "amount_column", "description_column")]

        if len(set(columns)) != 3:
            raise serializers.ValidationError("Use uma coluna diferente para data, valor e descrição.")

        owner = self.context["request"].user

        if CsvMapping.objects.filter(owner=owner, name=attrs["name"]).exists():
            raise serializers.ValidationError({"name": "Já existe um mapeamento com este nome."})

        return attrs
