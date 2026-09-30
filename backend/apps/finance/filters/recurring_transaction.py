import django_filters

from apps.finance.models import RecurringTransaction


class RecurringTransactionFilter(django_filters.FilterSet):
    class Meta:
        model = RecurringTransaction
        fields = (
            "type",
            "frequency",
            "is_active",
        )
