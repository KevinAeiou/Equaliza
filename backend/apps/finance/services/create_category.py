from apps.finance.models import FinancialCategory


class CreateFinancialCategoryService:

    @staticmethod
    def execute(*, user, data):
        return FinancialCategory.objects.create(
            family=user.current_family,
            **data,
        )
