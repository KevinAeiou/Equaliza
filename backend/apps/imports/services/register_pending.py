from django.db import transaction

from apps.finance.constants import DESCRIPTION_MAX_LENGTH
from apps.finance.services import ExpenseService
from apps.imports.enums import Direction, PendingStatus
from apps.imports.exceptions import PendingConflict
from apps.imports.models import PendingTransaction
from apps.imports.services.resolve_pending import ResolvePendingService


class RegisterPendingService:
    """Registra pendências como despesa. Tudo em transação, com as linhas travadas, para que a
    mesma pendência nunca vire duas despesas."""

    @classmethod
    def lock(cls, owner, ids):
        rows = list(PendingTransaction.objects.select_for_update().filter(owner=owner, pk__in=ids))

        if len(rows) != len(set(ids)):
            return None

        return rows

    @classmethod
    def check(cls, rows):
        for row in rows:
            if row.status != PendingStatus.PENDING:
                raise PendingConflict("Esta pendência já foi tratada.")

            if row.direction != Direction.DEBIT:
                raise PendingConflict("Créditos só podem ser marcados como lidos por enquanto.")

    @classmethod
    def create_expense(cls, user, row, family, category, amount=None, date=None, description=None):
        text = row.description if description is None else description

        expense = ExpenseService.create(
            user=user,
            family=family,
            data={
                "amount": amount if amount is not None else row.amount,
                "date": date or row.occurred_at,
                "description": (text or "")[:DESCRIPTION_MAX_LENGTH],
                "category": category,
            },
        )
        ResolvePendingService.mark_imported(row, expense)

        return expense

    @classmethod
    @transaction.atomic
    def register_one(cls, user, pending_id, family, category, **overrides):
        rows = cls.lock(user, [pending_id])

        if rows is None:
            return None

        cls.check(rows)

        return cls.create_expense(user, rows[0], family, category, **overrides)

    @classmethod
    @transaction.atomic
    def register_many(cls, user, ids, family, category):
        rows = cls.lock(user, ids)

        if rows is None:
            return None

        cls.check(rows)

        for row in rows:
            cls.create_expense(user, row, family, category)

        return len(rows)

    @classmethod
    @transaction.atomic
    def dismiss_many(cls, user, ids):
        rows = cls.lock(user, ids)

        if rows is None:
            return None

        if any(row.status != PendingStatus.PENDING for row in rows):
            raise PendingConflict("Há pendências já tratadas na seleção.")

        return ResolvePendingService.dismiss(user, ids)
