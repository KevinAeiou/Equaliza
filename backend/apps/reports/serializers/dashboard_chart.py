from rest_framework import serializers


class IncomeVsExpenseSerializer(serializers.Serializer):
    month = serializers.CharField()
    income = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        coerce_to_string=False,
    )
    expense = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        coerce_to_string=False,
    )


class ExpensesByCategorySerializer(serializers.Serializer):
    category = serializers.CharField()
    value = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        coerce_to_string=False,
    )


class MemberContributionsSerializer(serializers.Serializer):
    member = serializers.CharField()
    expected = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        coerce_to_string=False,
    )
    paid = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        coerce_to_string=False,
    )
    difference = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        coerce_to_string=False,
    )


class DashboardChartSerializer(serializers.Serializer):
    income_vs_expense = IncomeVsExpenseSerializer(many=True)
    expenses_by_category = ExpensesByCategorySerializer(many=True)
    member_contributions = MemberContributionsSerializer(many=True)
