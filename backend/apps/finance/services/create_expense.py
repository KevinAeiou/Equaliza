from apps.finance.models import Expense


class CreateExpenseService:

    @staticmethod
    def execute(user, data):

        return Expense.objects.create(
            created_by=user, updated_by=user, family=user.current_family, **data
        )
