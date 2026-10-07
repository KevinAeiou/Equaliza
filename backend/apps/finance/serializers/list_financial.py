from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.core.serializers import UserRefSerializer, user_ref
from apps.finance.serializers.list_category import ListFinancialCategorySerializer


# Campos de listagem comuns a receitas e despesas; a subclasse define o `Meta.model`.
class ListFinancialSerializer(serializers.ModelSerializer):
    category = ListFinancialCategorySerializer(read_only=True)
    created_by = serializers.SerializerMethodField()

    class Meta:
        fields = (
            "id",
            "amount",
            "date",
            "category",
            "description",
            "created_by",
            "created_at",
            "updated_at",
        )

    @extend_schema_field(UserRefSerializer(allow_null=True))
    def get_created_by(self, obj):
        return user_ref(obj.created_by)
