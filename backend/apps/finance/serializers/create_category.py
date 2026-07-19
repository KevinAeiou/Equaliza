from rest_framework import serializers

from apps.finance.models import FinancialCategory
from .base_category import BaseFinancialCategorySerializer


class CreateFinancialCategorySerializer(BaseFinancialCategorySerializer):

    def validate_name(self, attrs):
        family = self.context["request"].user.current_family

        if FinancialCategory.objects.exists_by_name(
            family=family,
            category_type=attrs["type"],
            name=attrs["name"],
        ):
            raise serializers.ValidationError(
                {"name": "Já existe uma categoria com esse nome."}
            )

        return attrs
