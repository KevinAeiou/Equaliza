from rest_framework import serializers

from apps.settlements.serializers.month import MonthField


class BalanceParamsSerializer(serializers.Serializer):
    month = MonthField(required=False, help_text="Mês no formato AAAA-MM. Sem ele, vale o mês atual.")


class BalanceMemberSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    is_active = serializers.BooleanField()
    paid = serializers.DecimalField(max_digits=12, decimal_places=2)
    quota = serializers.DecimalField(max_digits=12, decimal_places=2)
    difference = serializers.DecimalField(max_digits=12, decimal_places=2)
    previous_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    settled = serializers.DecimalField(max_digits=12, decimal_places=2)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2)


class SuggestionSerializer(serializers.Serializer):
    payer = serializers.IntegerField()
    payer_name = serializers.CharField()
    receiver = serializers.IntegerField()
    receiver_name = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)


class BalanceSerializer(serializers.Serializer):
    month = serializers.CharField()
    settlement_start = serializers.CharField()
    my_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    members = BalanceMemberSerializer(many=True)
    suggestions = SuggestionSerializer(many=True)
