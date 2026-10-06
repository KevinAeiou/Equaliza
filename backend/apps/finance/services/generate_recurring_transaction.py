from django.db import transaction
from django.utils import timezone

from apps.finance.enums import CategoryType
from apps.finance.models import Expense, Income, RecurringTransaction
from apps.finance.utils import occurrence_date


class GenerateRecurringTransactionsService:
    """Cria as despesas/receitas vencidas de cada recorrência e avança a próxima data."""

    MODELS = {
        CategoryType.EXPENSE: Expense,
        CategoryType.INCOME: Income,
    }

    @staticmethod
    def execute(today=None, recurring_transactions=None, family=None):
        today = today or timezone.localdate()

        if recurring_transactions is None:
            recurring_transactions = RecurringTransaction.objects.due(today)

        if family is not None:
            recurring_transactions = recurring_transactions.filter(family=family)

        if not recurring_transactions.exists():
            return 0

        created = 0

        # select_for_update exige transação aberta; sem ela o comando falhava.
        with transaction.atomic():
            for recurring in recurring_transactions.select_for_update():
                created += GenerateRecurringTransactionsService._generate(recurring, today)

        return created

    @staticmethod
    @transaction.atomic
    def _generate(recurring, today):
        model = GenerateRecurringTransactionsService.MODELS[recurring.type]
        created = 0

        while recurring.is_active and recurring.next_date <= today:
            model.objects.create(
                family=recurring.family,
                amount=recurring.amount,
                date=recurring.next_date,
                description=recurring.description,
                category=recurring.category,
                created_by=recurring.created_by,
                updated_by=recurring.created_by,
            )
            created += 1
            recurring.generated_count += 1
            recurring.next_date = occurrence_date(
                recurring.start_date, recurring.frequency, recurring.generated_count
            )

            if recurring.end_date and recurring.next_date > recurring.end_date:
                recurring.is_active = False

        recurring.save(update_fields=("generated_count", "next_date", "is_active"))

        return created
