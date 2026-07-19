from apps.finance.models import FinancialCategory


class ListFinancialCategoryService:

    @staticmethod
    def execute(user):
        return FinancialCategory.objects.for_family(
            user.current_family,
        )