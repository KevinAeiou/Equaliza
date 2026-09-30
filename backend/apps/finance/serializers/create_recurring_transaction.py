from rest_framework import serializers

from apps.finance.constants import DESCRIPTION_MAX_LENGTH
from apps.finance.enums import CategoryType, RecurrenceFrequency
from apps.finance.models import FinancialCategory


class CreateRecurringTransactionSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=CategoryType.choices)
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0.01,
    )
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=DESCRIPTION_MAX_LENGTH,
    )
    category = serializers.PrimaryKeyRelatedField(
        queryset=FinancialCategory.objects.all(),
    )
    frequency = serializers.ChoiceField(choices=RecurrenceFrequency.choices)
    start_date = serializers.DateField()
    end_date = serializers.DateField(required=False, allow_null=True)

    def validate_category(self, category):
        family = self.context["request"].user.current_family

        if category.family_id and category.family_id != family.id:
            raise serializers.ValidationError(
                "Esta categoria não pertence à família atual."
            )

        return category

    def validate(self, attrs):
        attrs = super().validate(attrs)

        if attrs["category"].type != attrs["type"]:
            raise serializers.ValidationError(
                {"category": "Categoria inválida para este tipo de recorrência."}
            )

        end_date = attrs.get("end_date")

        if end_date and end_date < attrs["start_date"]:
            raise serializers.ValidationError(
                {"end_date": "A data final não pode ser anterior à data inicial."}
            )

        return attrs
