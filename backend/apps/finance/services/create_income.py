from apps.finance.models import Income


class CreateIncomeService:

    @staticmethod
    def execute(user, data):

        return Income.objects.create(
            created_by=user, updated_by=user, family=user.current_family, **data
        )
