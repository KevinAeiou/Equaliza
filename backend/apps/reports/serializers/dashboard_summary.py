from rest_framework import serializers


class DashboardSummarySerializer(serializers.Serializer):
    balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    income = serializers.DecimalField(max_digits=12, decimal_places=2)
    expense = serializers.DecimalField(max_digits=12, decimal_places=2)
    members = serializers.IntegerField()
