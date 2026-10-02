from apps.finance.models import RecurringTransaction

from apps.finance.services.generate_recurring_transaction import (
    GenerateRecurringTransactionsService,
)


class ListRecurringTransactionService:

    @staticmethod
    def execute(user):
        # Garante que as recorrências vencidas já estejam lançadas (sem depender de cron).
        GenerateRecurringTransactionsService.execute(family=user.current_family)

        return (
            RecurringTransaction.objects.for_family(user.current_family)
            .select_related(
                "category",
                "created_by",
            )
            .order_by("-is_active", "next_date", "-created_at")
        )
