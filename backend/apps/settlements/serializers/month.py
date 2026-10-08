from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.settlements.periods import parse_month


class MonthField(serializers.CharField):
    """Mês no formato `AAAA-MM`; internamente vira o primeiro dia do mês."""

    def to_internal_value(self, data):
        value = super().to_internal_value(data)

        try:
            return parse_month(value)
        except DjangoValidationError as error:
            raise serializers.ValidationError(error.messages[0]) from None
