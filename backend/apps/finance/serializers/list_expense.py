from rest_framework import serializers

from apps.finance.models import Expense
from ..serializers.list_category import ListFinancialCategorySerializer


class ListExpenseSerializer(serializers.ModelSerializer):
    category = ListFinancialCategorySerializer(read_only=True)

    class Meta:
        model = Expense
        fields = (
            "id",
            "amount",
            "date",
            "category",
            "description",
            "created_at",
            "updated_at",
        )
