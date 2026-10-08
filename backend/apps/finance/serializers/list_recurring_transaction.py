from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.core.serializers import UserRefSerializer, user_ref

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

    @extend_schema_field(UserRefSerializer(allow_null=True))
    def get_created_by(self, obj):
        return user_ref(obj.created_by)
