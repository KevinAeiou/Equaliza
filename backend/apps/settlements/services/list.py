from django.db.models import Q

from apps.settlements.models import Settlement


class ListSettlementService:
    @staticmethod
    def execute(user, *, month=None, member=None, status=None):
        queryset = (
            Settlement.objects.filter(family_id=user.current_family_id)
            .select_related("payer", "receiver", "cancelled_by")
            .order_by("-paid_at", "-created_at")
        )

        if month:
            queryset = queryset.filter(reference_month=month)

        if member:
            queryset = queryset.filter(Q(payer_id=member) | Q(receiver_id=member))

        if status:
            queryset = queryset.filter(status=status)

        return queryset
