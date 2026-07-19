from rest_framework import serializers

from apps.finance.models import Income
from ..serializers.list_category import ListFinancialCategorySerializer


class ListIncomeSerializer(serializers.ModelSerializer):
    category = ListFinancialCategorySerializer(read_only=True)

    class Meta:
        model = Income
        fields = (
            "id",
            "amount",
            "date",
            "category",
            "description",
            "created_at",
            "updated_at",
        )
