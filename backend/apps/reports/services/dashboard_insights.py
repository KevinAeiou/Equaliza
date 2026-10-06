from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone

from apps.finance.enums import CategoryType
from apps.finance.models import Expense, Income, RecurringTransaction
from apps.reports.insights import Entry, Recurring, build_insights, insights_window
from apps.reports.insights import MONTH
from apps.reports.serializers.dashboard_insights import DashboardInsightsParamsSerializer


class DashboardInsightsService:

    @staticmethod
    def parse(params):
        serializer = DashboardInsightsParamsSerializer(
            data={
                "from_date": params.get("from_date"),
                "to_date": params.get("to_date"),
                "period_type": params.get("period_type") or MONTH,
                "categories": params.getlist("categories"),
            }
        )
        serializer.is_valid(raise_exception=True)

        return serializer.validated_data

    @staticmethod
    def execute(user, params):
        filters = DashboardInsightsService.parse(params)
        period_type = filters["period_type"]
        start, end = filters["from_date"], filters["to_date"]
        categories = filters.get("categories")
        family = user.current_family

        window_start, _ = insights_window(period_type, start, end)

        expenses = Expense.objects.for_family(family).filter(date__gte=window_start, date__lte=end)
        recurring = RecurringTransaction.objects.filter(
            family=family,
            type=CategoryType.EXPENSE,
            is_active=True,
        )

        if categories:
            expenses = expenses.filter(category_id__in=categories)
            recurring = recurring.filter(category_id__in=categories)

        entries = [
            Entry(
                date=expense.date,
                category_id=expense.category_id,
                category=expense.category.name,
                title=expense.description.strip() or expense.category.name,
                amount=float(expense.amount),
            )
            for expense in expenses.select_related("category")
        ]

        # Receita só entra sem filtro de categorias: filtrar despesas por categoria tira o sentido da comparação.
        income = None

        if not categories:
            total = Income.objects.for_family(family).filter(date__gte=start, date__lte=end).aggregate(total=Sum("amount"))["total"]
            income = float(total or Decimal("0"))

        return build_insights(
            period_type,
            start,
            end,
            current=[entry for entry in entries if start <= entry.date <= end],
            history=[entry for entry in entries if entry.date < start],
            today=timezone.localdate(),
            income=income,
            recurring=[
                Recurring(
                    category_id=item.category_id,
                    title=item.description.strip() or item.category.name,
                    amount=float(item.amount),
                    frequency=item.frequency,
                    start_date=item.start_date,
                    end_date=item.end_date,
                    generated_count=item.generated_count,
                )
                for item in recurring.select_related("category")
            ],
        )
