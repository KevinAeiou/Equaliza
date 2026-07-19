from typing import cast

from django.http import QueryDict
from django.db.models import QuerySet
from django.utils import timezone
from django_filters import rest_framework as filters


class DashboardFilter(filters.FilterSet):

    class Meta:
        fields = []

    @property
    def qs(self) -> QuerySet:
        queryset = super().qs

        data = cast(QueryDict, self.data)

        from_date = data.get("from")
        to_date = data.get("to")

        if from_date:
            queryset = queryset.filter(date__gte=from_date)

        if to_date:
            queryset = queryset.filter(date__lte=to_date)

        categories = data.getlist("categories")

        if categories:
            queryset = queryset.filter(category_id__in=categories)

        if not from_date and not to_date:
            today = timezone.localdate()

            queryset = queryset.filter(
                date__year=today.year,
                date__month=today.month,
            )

        return queryset
