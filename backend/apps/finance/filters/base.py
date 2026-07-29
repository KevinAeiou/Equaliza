import django_filters

from apps.finance.models import FinancialCategory


class BaseFilter(django_filters.FilterSet):
    from_date = django_filters.DateFilter(
        field_name="date",
        lookup_expr="gte",
    )

    to_date = django_filters.DateFilter(
        field_name="date",
        lookup_expr="lte",
    )

    categories = django_filters.ModelMultipleChoiceFilter(
        field_name="category",
        queryset=FinancialCategory.objects.all(),
    )
