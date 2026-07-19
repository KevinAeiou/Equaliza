from apps.finance.models import Income


class ListIncomeService:

    @staticmethod
    def execute(user):
        return (
            Income.objects.for_family(user.current_family)
            .filter(created_by=user)
            .select_related(
                "category",
                "created_by",
            )
            .order_by("-date", "-created_at")
        )
