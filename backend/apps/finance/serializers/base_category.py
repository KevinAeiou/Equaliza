from rest_framework import serializers

from apps.finance.enums import CategoryType


class BaseFinancialCategorySerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, trim_whitespace=True)
    type = serializers.ChoiceField(choices=CategoryType.choices)