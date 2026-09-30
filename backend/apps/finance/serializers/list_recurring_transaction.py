from rest_framework import serializers

from apps.finance.models import RecurringTransaction
from ..serializers.list_category import ListFinancialCategorySerializer


class ListRecurringTransactionSerializer(serializers.ModelSerializer):
    category = ListFinancialCategorySerializer(read_only=True)
    created_by = serializers.SerializerMethodField()

    class Meta:
        model = RecurringTransaction
        fields = (
            "id",
            "type",
            "amount",
            "description",
            "category",
            "frequency",
            "start_date",
            "end_date",
            "next_date",
            "is_active",
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
