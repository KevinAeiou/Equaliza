import django_filters
from django.contrib.auth import get_user_model

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

    members = django_filters.ModelMultipleChoiceFilter(
        field_name="created_by",
        queryset=get_user_model().objects.all(),
    )
