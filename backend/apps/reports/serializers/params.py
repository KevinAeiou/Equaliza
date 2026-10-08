from rest_framework import serializers


class DashboardFilterParamsSerializer(serializers.Serializer):
    """Filtros de query do resumo e dos gráficos. Sem datas, vale o mês atual."""

    from_date = serializers.DateField(required=False)
    to_date = serializers.DateField(required=False)
    categories = serializers.ListField(child=serializers.IntegerField(), required=False)
