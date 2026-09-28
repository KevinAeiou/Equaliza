from django.db.models import Count, Q

from apps.finance.models import FinancialCategory


class ListFinancialCategoryService:

    @staticmethod
    def execute(user):
        family = user.current_family

        # Categorias padrão são compartilhadas: conta apenas os lançamentos da família atual.
        return FinancialCategory.objects.for_family(family).annotate(
            expenses_count=Count("expenses", filter=Q(expenses__family=family), distinct=True),
            incomes_count=Count("incomes", filter=Q(incomes__family=family), distinct=True),
        ).order_by("type", "name")
