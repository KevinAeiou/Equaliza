from rest_framework import serializers

from apps.finance.models import FinancialCategory
from .base_category import BaseFinancialCategorySerializer


class UpdateFinancialCategorySerializer(BaseFinancialCategorySerializer):

    def validate(self, attrs):
        family = self.context["request"].user.current_family

        if FinancialCategory.objects.exists_by_name_excluding(
            family=family,
            category_type=attrs["type"],
            name=attrs["name"],
            category=self.instance,
        ):
            raise serializers.ValidationError(
                {"name": "Já existe uma categoria com esse nome."}
            )

        return attrs
