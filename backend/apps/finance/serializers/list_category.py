from rest_framework import serializers

from apps.finance.models import FinancialCategory


class ListFinancialCategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = FinancialCategory
        fields = (
            "id",
            "name",
            "type",
        )
