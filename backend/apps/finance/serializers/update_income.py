from rest_framework import serializers

from ..enums import CategoryType
from .base_financial import BaseFinancialSerializer

class UpdateIncomeSerializer(BaseFinancialSerializer):

    def validate(self, attrs):
        attrs = super().validate(attrs)

        category = attrs.get("category")

        if category and category.type != CategoryType.INCOME:
            raise serializers.ValidationError(
                {"category": "Categoria inválida para uma receita."}
            )

        return attrs
