from django.db.models import Q
from django.utils import timezone

from apps.imports.enums import PendingStatus
from apps.imports.models import ImportBatch, PendingTransaction


class PurgePendingService:
    @classmethod
    def execute(cls):
        """Expira as pendências vencidas, apaga qualquer dado sensível que tenha sobrado e remove lotes vazios."""
        expired = PendingTransaction.objects.filter(
            status=PendingStatus.PENDING, expires_at__lte=timezone.now()
        ).update(status=PendingStatus.EXPIRED)

        leftovers = (
            PendingTransaction.objects.exclude(status=PendingStatus.PENDING)
            .filter(~Q(description="") | ~Q(counterparty=""))
            .update(description="", counterparty="")
        )

        # Lotes sem nenhuma linha (reenvio do mesmo arquivo) não servem a ninguém.
        ImportBatch.objects.filter(transactions__isnull=True).delete()

        return expired, leftovers
