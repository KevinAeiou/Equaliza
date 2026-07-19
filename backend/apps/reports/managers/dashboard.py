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

        incomes = (
            incomes.annotate(month=TruncMonth("date"))
            .values("month")
            .annotate(total=Sum("amount"))
            .order_by("month")
        )

        expenses = (
            expenses.annotate(month=TruncMonth("date"))
            .values("month")
            .annotate(total=Sum("amount"))
            .order_by("month")
        )

        months = {}

        for income in incomes:
            key = income["month"]

            months.setdefault(
                key,
                {
                    "month": key.strftime("%b"),
                    "income": 0,
                    "expense": 0,
                },
            )

            months[key]["income"] = income["total"]

        for expense in expenses:
            key = expense["month"]

            months.setdefault(
                key,
                {
                    "month": key.strftime("%b"),
                    "income": 0,
                    "expense": 0,
                },
            )

            months[key]["expense"] = expense["total"]

        expenses_by_category = (
            DashboardFilter(
                filters,
                queryset=Expense.objects.filter(family=family),
            )
            .qs.values("category__name")
            .annotate(value=Sum("amount"))
            .order_by("-value")
        )

        income_by_member = {
            item["created_by"]: item["total"]
            for item in (
                DashboardFilter(
                    filters,
                    queryset=Income.objects.filter(family=family),
                )
                .qs.values("created_by")
                .annotate(total=Sum("amount"))
            )
        }

        paid_by_member = {
            item["created_by"]: item["total"]
            for item in (
                DashboardFilter(
                    filters,
                    queryset=Expense.objects.filter(family=family),
                )
                .qs.values("created_by")
                .annotate(total=Sum("amount"))
            )
        }

        total_income = sum(income_by_member.values(), Decimal("0.00"))
        total_expense = sum(paid_by_member.values(), Decimal("0.00"))

        member_contributions = []

        for member in family.memberships.select_related("created_by"):
            user = member.created_by

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
            "income_vs_expense": list(months.values()),
            "expenses_by_category": [
                {
                    "category": item["category__name"],
                    "value": item["value"],
                }
                for item in expenses_by_category
            ],
            "member_contributions": member_contributions,
        }
