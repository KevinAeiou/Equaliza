from rest_framework import serializers

from apps.reports.insights import PERIOD_TYPES, MONTH


class DashboardInsightsParamsSerializer(serializers.Serializer):
    from_date = serializers.DateField()
    to_date = serializers.DateField()
    period_type = serializers.ChoiceField(choices=PERIOD_TYPES, default=MONTH)
    categories = serializers.ListField(child=serializers.IntegerField(), required=False)

    def validate(self, attrs):
        if attrs["from_date"] > attrs["to_date"]:
            raise serializers.ValidationError("from_date não pode ser posterior a to_date.")

        return attrs


class InsightBarSerializer(serializers.Serializer):
    label = serializers.CharField()
    value = serializers.CharField()
    fraction = serializers.FloatField()
    highlighted = serializers.BooleanField()


class InsightProgressSerializer(serializers.Serializer):
    fraction = serializers.FloatField()
    start = serializers.CharField()
    end = serializers.CharField()


class InsightSparkPointSerializer(serializers.Serializer):
    label = serializers.CharField()
    value = serializers.CharField()
    fraction = serializers.FloatField()
    highlighted = serializers.BooleanField()


class InsightSerializer(serializers.Serializer):
    kind = serializers.CharField()
    tone = serializers.CharField()
    tag = serializers.CharField()
    title = serializers.CharField()
    body = serializers.CharField()
    bars = InsightBarSerializer(many=True)
    progress = InsightProgressSerializer(allow_null=True)
    spark = InsightSparkPointSerializer(many=True)
    note = serializers.CharField(allow_null=True)


class CategoryComparisonSerializer(serializers.Serializer):
    name = serializers.CharField()
    value = serializers.FloatField()
    average = serializers.FloatField(allow_null=True)
    change = serializers.FloatField(allow_null=True)


class DashboardInsightsSerializer(serializers.Serializer):
    insights = InsightSerializer(many=True)
    comparisons = CategoryComparisonSerializer(many=True)
    has_expenses = serializers.BooleanField()
    has_history = serializers.BooleanField()
    has_previous = serializers.BooleanField()
    history_periods = serializers.IntegerField()
    average_label = serializers.CharField()
    above_count = serializers.IntegerField()
    below_count = serializers.IntegerField()
    dropped_count = serializers.IntegerField()
