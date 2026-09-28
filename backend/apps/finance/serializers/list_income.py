from rest_framework import serializers

from apps.finance.models import Income
from ..serializers.list_category import ListFinancialCategorySerializer


class ListIncomeSerializer(serializers.ModelSerializer):
    category = ListFinancialCategorySerializer(read_only=True)
    created_by = serializers.SerializerMethodField()

    class Meta:
        model = Income
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

    def get_created_by(self, obj):
        user = obj.created_by

        if user is None:
            return None

        return {
            "id": user.id,
            "name": user.get_full_name() or user.email,
        }
