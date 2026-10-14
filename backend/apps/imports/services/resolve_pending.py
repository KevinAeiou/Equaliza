from django.db import transaction

from apps.imports.enums import PendingStatus
from apps.imports.models import PendingTransaction


class ResolvePendingService:
    @classmethod
    @transaction.atomic
    def dismiss(cls, owner, ids):
        """Marca como lidas: sai da lista e apaga descrição e contraparte."""
        rows = list(
            PendingTransaction.objects.select_for_update()
            .filter(owner=owner, pk__in=ids, status=PendingStatus.PENDING)
        )

        for row in rows:
            row.status = PendingStatus.DISMISSED
            row.erase_sensitive_data()

        PendingTransaction.objects.bulk_update(rows, ("status", "description", "counterparty"))

        return len(rows)

    @classmethod
    def mark_imported(cls, pending, expense):
        """Chamado depois de criar a despesa; trava a linha antes, para não importar duas vezes."""
        pending.status = PendingStatus.IMPORTED
        pending.expense = expense
        pending.erase_sensitive_data()
        pending.save(update_fields=("status", "expense", "description", "counterparty"))
