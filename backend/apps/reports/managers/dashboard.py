from collections import defaultdict
from decimal import Decimal

from django.db.models import DecimalField, Sum, Value
from django.db.models.functions import Coalesce, TruncMonth

from apps.families.models import FamilyMember
from apps.finance.models import Expense, Income
from apps.reports.filters import DashboardFilter

ZERO = Decimal("0.00")
CENTS = Decimal("0.01")


def _filtered(model, family, filters):
    return DashboardFilter(filters, queryset=model.objects.for_family(family)).qs


def _total(queryset):
    return queryset.aggregate(
        total=Coalesce(
            Sum("amount"),
            Value(ZERO),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )
    )["total"]


class DashboardManager:
    @staticmethod
    def get_summary(family, filters):
        income = _total(_filtered(Income, family, filters))
        expense = _total(_filtered(Expense, family, filters))

        members = FamilyMember.objects.filter(
            family=family,
            is_active=True,
        ).count()

        return {
            "balance": income - expense,
            "income": income,
            "expense": expense,
            "members": members,
        }

    @staticmethod
    def get_charts(family, filters):
        incomes = _filtered(Income, family, filters)
        expenses = _filtered(Expense, family, filters)

        # Uma consulta por tipo; os agrupamentos por mês, categoria e membro saem das mesmas linhas.
        income_rows = (
            incomes.annotate(month=TruncMonth("date"))
            .values("month", "created_by")
            .annotate(total=Sum("amount"))
        )
        expense_rows = (
            expenses.annotate(month=TruncMonth("date"))
            .values("month", "created_by", "category__name")
            .annotate(total=Sum("amount"))
        )

        income_by_month = defaultdict(Decimal)
        expense_by_month = defaultdict(Decimal)
        expense_by_category = defaultdict(Decimal)
        income_by_member = defaultdict(Decimal)
        paid_by_member = defaultdict(Decimal)

        for row in income_rows:
            income_by_month[row["month"]] += row["total"]
            income_by_member[row["created_by"]] += row["total"]

        for row in expense_rows:
            expense_by_month[row["month"]] += row["total"]
            expense_by_category[row["category__name"]] += row["total"]
            paid_by_member[row["created_by"]] += row["total"]

        months = sorted(set(income_by_month) | set(expense_by_month))

        total_income = sum(income_by_member.values(), ZERO)
        total_expense = sum(paid_by_member.values(), ZERO)

        member_contributions = []

        for member in family.memberships.select_related("user"):
            user = member.user

            paid = paid_by_member.get(user.id, ZERO)

            # Cada membro deveria cobrir as despesas na proporção do que ganhou.
            if total_income:
                expected = (income_by_member.get(user.id, ZERO) / total_income) * total_expense
            else:
                expected = ZERO

            member_contributions.append(
                {
                    "member": user.get_full_name() or user.first_name or user.email,
                    "expected": expected.quantize(CENTS),
                    "paid": paid,
                    "difference": (paid - expected).quantize(CENTS),
                }
            )

        return {
            "income_vs_expense": [
                {
                    "period": month.strftime("%Y-%m"),
                    "income": income_by_month.get(month, ZERO),
                    "expense": expense_by_month.get(month, ZERO),
                }
                for month in months
            ],
            "expenses_by_category": [
                {"category": name, "value": value}
                for name, value in sorted(
                    expense_by_category.items(), key=lambda item: item[1], reverse=True
                )
            ],
            "member_contributions": member_contributions,
        }
