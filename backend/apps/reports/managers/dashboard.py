from decimal import Decimal

from django.db.models import DecimalField, Sum
from django.db.models.functions import Coalesce, TruncMonth

from apps.finance.models import Income
from apps.finance.models import Expense
from apps.families.models import FamilyMember
from apps.reports.filters import DashboardFilter


class DashboardManager:
    @staticmethod
    def get_summary(family, filters):
        incomes = DashboardFilter(
            filters,
            queryset=Income.objects.for_family(family),
        ).qs

        expenses = DashboardFilter(
            filters,
            queryset=Expense.objects.for_family(family),
        ).qs

        income = incomes.aggregate(
            total=Coalesce(
                Sum("amount"),
                Decimal("0.00"),
                output_field=DecimalField(
                    max_digits=12,
                    decimal_places=2,
                ),
            )
        )["total"]

        expense = expenses.aggregate(
            total=Coalesce(
                Sum("amount"),
                Decimal("0.00"),
                output_field=DecimalField(
                    max_digits=12,
                    decimal_places=2,
                ),
            )
        )["total"]

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
        incomes = DashboardFilter(
            filters,
            queryset=Income.objects.filter(family=family),
        ).qs

        expenses = DashboardFilter(
            filters,
            queryset=Expense.objects.filter(family=family),
        ).qs

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

        months = {}
        by_category = {}
        income_by_member = {}
        paid_by_member = {}

        def month_entry(key):
            return months.setdefault(
                key,
                {
                    "month": key.strftime("%b"),
                    "period": key.strftime("%Y-%m"),
                    "income": 0,
                    "expense": 0,
                },
            )

        for row in income_rows:
            month_entry(row["month"])["income"] += row["total"]

            income_by_member[row["created_by"]] = (
                income_by_member.get(row["created_by"], Decimal("0.00")) + row["total"]
            )

        for row in expense_rows:
            month_entry(row["month"])["expense"] += row["total"]

            by_category[row["category__name"]] = (
                by_category.get(row["category__name"], Decimal("0.00")) + row["total"]
            )
            paid_by_member[row["created_by"]] = (
                paid_by_member.get(row["created_by"], Decimal("0.00")) + row["total"]
            )

        total_income = sum(income_by_member.values(), Decimal("0.00"))
        total_expense = sum(paid_by_member.values(), Decimal("0.00"))

        member_contributions = []

        for member in family.memberships.select_related("user"):
            user = member.user

            income = income_by_member.get(user.id, Decimal("0.00"))
            paid = paid_by_member.get(user.id, Decimal("0.00"))

            if total_income:
                expected = (income / total_income) * total_expense
            else:
                expected = Decimal("0.00")

            member_contributions.append(
                {
                    "member": user.get_full_name() or user.first_name or user.email,
                    "expected": expected.quantize(Decimal("0.01")),
                    "paid": paid,
                    "difference": (paid - expected).quantize(Decimal("0.01")),
                }
            )

        return {
            "income_vs_expense": [months[key] for key in sorted(months)],
            "expenses_by_category": [
                {"category": name, "value": value}
                for name, value in sorted(
                    by_category.items(), key=lambda item: item[1], reverse=True
                )
            ],
            "member_contributions": member_contributions,
        }
