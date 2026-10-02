from apps.finance.models import Income

from apps.finance.services.generate_recurring_transaction import (
    GenerateRecurringTransactionsService,
)


class ListIncomeService:

    @staticmethod
    def execute(user):
        # Garante que as recorrências vencidas já estejam lançadas (sem depender de cron).
        GenerateRecurringTransactionsService.execute(family=user.current_family)

        return (
            Income.objects.for_family(user.current_family)
            .select_related(
                "category",
                "created_by",
            )
            .order_by("-date", "-created_at")
        )
