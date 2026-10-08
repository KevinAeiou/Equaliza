from collections import defaultdict

from django.db.models import Sum
from django.db.models.functions import TruncMonth

from apps.finance.models import Expense, Income
from apps.settlements.calculations import (
    ZERO,
    accumulate_balances,
    month_differences,
    month_quotas,
    suggest_settlements,
)
from apps.settlements.enums import SettlementStatus
from apps.settlements.models import Settlement
from apps.settlements.periods import add_months, month_range


def _by_month_and_user(model, family, start, end):
    rows = (
        model.objects.for_family(family)
        .filter(date__gte=start, date__lt=end)
        .annotate(month=TruncMonth("date"))
        .values("month", "created_by")
        .annotate(total=Sum("amount"))
    )
    result = defaultdict(lambda: defaultdict(lambda: ZERO))

    for row in rows:
        result[row["month"]][row["created_by"]] += row["total"]

    return result


def _display_name(user):
    return user.get_full_name() or user.first_name or user.email


class BalanceService:
    """Saldo de acerto de uma família até o fim de um mês (`month` = primeiro dia do mês)."""

    @staticmethod
    def user_balances(family, month):
        """Saldos finais `{user_id: Decimal}` do mês. Usado para validar pagamentos."""
        return BalanceService.compute(family, month)["balances"]

    @staticmethod
    def compute(family, month, requesting_user=None):
        start = family.settlement_start
        memberships = list(family.memberships.select_related("user"))
        active_ids = [m.user_id for m in memberships if m.is_active]
        users = {m.user_id: m.user for m in memberships}

        monthly = {}

        if month >= start:
            end = add_months(month, 1)
            incomes = _by_month_and_user(Income, family, start, end)
            expenses = _by_month_and_user(Expense, family, start, end)

            for current in month_range(start, month):
                paid = dict(expenses.get(current, {}))
                total_expense = sum(paid.values(), ZERO)
                quotas = month_quotas(total_expense, dict(incomes.get(current, {})), active_ids)
                monthly[current] = (paid, quotas, month_differences(paid, quotas))

        settlements = list(
            Settlement.objects.filter(
                family=family,
                status=SettlementStatus.ACTIVE,
                reference_month__gte=start,
                reference_month__lte=month,
            )
        )
        previous_settlements = [s for s in settlements if s.reference_month < month]
        month_settlements = [s for s in settlements if s.reference_month == month]

        def triples(items):
            return [(s.payer_id, s.receiver_id, s.amount) for s in items]

        previous_months = [diff for current, (_, _, diff) in monthly.items() if current < month]
        previous = accumulate_balances(previous_months, triples(previous_settlements))
        final = accumulate_balances(
            [diff for _, _, diff in monthly.values()], triples(settlements)
        )

        paid, quotas, difference = monthly.get(month, ({}, {}, {}))
        settled = accumulate_balances([], triples(month_settlements))

        rows = []
        for user_id in set(users) | set(final):
            member_final = final.get(user_id, ZERO)
            is_active = user_id in active_ids

            # Inativo só aparece enquanto houver algo em aberto ou movimento no mês.
            if not is_active and member_final == 0 and user_id not in paid and user_id not in quotas:
                continue
            if user_id not in users:
                continue

            rows.append(
                {
                    "id": user_id,
                    "name": _display_name(users[user_id]),
                    "is_active": is_active,
                    "paid": paid.get(user_id, ZERO),
                    "quota": quotas.get(user_id, ZERO),
                    "difference": difference.get(user_id, ZERO),
                    "previous_balance": previous.get(user_id, ZERO),
                    "settled": settled.get(user_id, ZERO),
                    "balance": member_final,
                }
            )

        rows.sort(key=lambda row: (not row["is_active"], row["name"].lower(), row["id"]))

        suggestions = [
            {
                "payer": payer,
                "payer_name": _display_name(users[payer]),
                "receiver": receiver,
                "receiver_name": _display_name(users[receiver]),
                "amount": amount,
            }
            for payer, receiver, amount in suggest_settlements(final)
        ]

        result = {
            "month": month.strftime("%Y-%m"),
            "settlement_start": start.strftime("%Y-%m"),
            "members": rows,
            "suggestions": suggestions,
            "balances": final,
        }

        if requesting_user is not None:
            result["my_balance"] = final.get(requesting_user.id, ZERO)

        return result
