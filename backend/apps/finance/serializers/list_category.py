from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.finance.models import FinancialCategory


class ListFinancialCategorySerializer(serializers.ModelSerializer):
    is_default = serializers.SerializerMethodField()
    usage_count = serializers.SerializerMethodField()

    class Meta:
        model = FinancialCategory
        fields = (
            "id",
            "name",
            "type",
            "is_default",
            "usage_count",
        )

    @extend_schema_field(serializers.BooleanField())
    def get_is_default(self, obj):
        return obj.family_id is None

    @extend_schema_field(serializers.IntegerField(allow_null=True))
    def get_usage_count(self, obj):
        # Só vem anotado na listagem; em respostas de criação/edição ou aninhadas fica None.
        expenses = getattr(obj, "expenses_count", None)
        incomes = getattr(obj, "incomes_count", None)

        if expenses is None or incomes is None:
            return None

        return expenses + incomes
