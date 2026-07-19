from rest_framework import serializers

from ..enums import CategoryType
from .base_financial import BaseFinancialSerializer


class UpdateExpenseSerializer(BaseFinancialSerializer):

    def validate(self, attrs):
        attrs = super().validate(attrs)

        category = attrs.get("category")

        if category and category.type != CategoryType.EXPENSE:
            raise serializers.ValidationError(
                {"category": "Categoria inválida para uma despesa."}
            )

        return attrs
