from apps.finance.models import RecurringTransaction


class ListRecurringTransactionService:

    @staticmethod
    def execute(user):
        return (
            RecurringTransaction.objects.for_family(user.current_family)
            .select_related(
                "category",
                "created_by",
            )
            .order_by("-is_active", "next_date", "-created_at")
        )
