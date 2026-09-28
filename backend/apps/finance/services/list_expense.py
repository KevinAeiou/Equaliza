from apps.finance.models import Expense


class ListExpenseService:

    @staticmethod
    def execute(user):
        return (
            Expense.objects.for_family(user.current_family)
            .select_related(
                "category",
                "created_by",
            )
            .order_by("-date", "-created_at")
        )
