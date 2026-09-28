import django_filters

from apps.finance.models import FinancialCategory


class CategoryFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(
        field_name="name",
        lookup_expr="icontains",
    )

    type = django_filters.CharFilter(
        field_name="type",
        lookup_expr="exact",
    )

    class Meta:
        model = FinancialCategory
        fields = (
            "name",
            "type",
        )
