import django_filters

from apps.imports.enums import PendingStatus
from apps.imports.models import PendingTransaction


class PendingTransactionFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=PendingStatus.choices)

    class Meta:
        model = PendingTransaction
        fields = ("status", "direction", "batch", "flag")
