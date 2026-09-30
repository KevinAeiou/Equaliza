from django.db import transaction

from apps.finance.models import RecurringTransaction
from apps.finance.services.generate_recurring_transaction import (
    GenerateRecurringTransactionsService,
)


class CreateRecurringTransactionService:

    @staticmethod
    @transaction.atomic
    def execute(user, data):
        recurring = RecurringTransaction.objects.create(
            created_by=user,
            updated_by=user,
            family=user.current_family,
            next_date=data["start_date"],
            **data,
        )

        # Lançamentos com data inicial no passado ou hoje já entram imediatamente.
        GenerateRecurringTransactionsService.execute(
            recurring_transactions=RecurringTransaction.objects.filter(pk=recurring.pk)
        )
        recurring.refresh_from_db()

        return recurring
