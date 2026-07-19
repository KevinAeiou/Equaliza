from rest_framework import serializers
from django.utils import timezone

from apps.finance.models import FinancialCategory
from apps.finance.constants import DESCRIPTION_MAX_LENGTH


class BaseFinancialSerializer(serializers.Serializer):
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0.01,
    )
    date = serializers.DateField(
        required=False,
        default=timezone.localdate,
    )
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=DESCRIPTION_MAX_LENGTH,
    )
    category = serializers.PrimaryKeyRelatedField(
        queryset=FinancialCategory.objects.all(),
    )

    def validate_category(self, category):
        family = self.context["request"].user.current_family

        if category.family_id and category.family_id != family.id:
            raise serializers.ValidationError(
                "Esta categoria não pertence à família atual."
            )

        return category
