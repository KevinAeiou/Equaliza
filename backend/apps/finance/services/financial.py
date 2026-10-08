from apps.finance.models import Expense, Income
from apps.finance.services.generate_recurring_transaction import (
    GenerateRecurringTransactionsService,
)


class FinancialService:
    """CRUD de lançamentos financeiros (receitas e despesas); as subclasses só definem o modelo."""

    model = None

    UPDATABLE_FIELDS = (
        "amount",
        "date",
        "description",
        "category",
    )

    @classmethod
    def list(cls, user):
        # Garante que as recorrências vencidas já estejam lançadas (sem depender de cron).
        GenerateRecurringTransactionsService.execute(family=user.current_family)

        return (
            cls.model.objects.for_family(user.current_family)
            .select_related(
                "category",
                "created_by",
            )
            .order_by("-date", "-created_at")
        )

    @classmethod
    def create(cls, user, data):
        return cls.model.objects.create(
            created_by=user, updated_by=user, family=user.current_family, **data
        )

    @classmethod
    def update(cls, instance, data):
        fields = [field for field in cls.UPDATABLE_FIELDS if field in data]

        for field in fields:
            setattr(instance, field, data[field])

        instance.save(update_fields=(*fields, "updated_by"))

        return instance

    @classmethod
    def delete(cls, instance):
        instance.delete()


class ExpenseService(FinancialService):
    model = Expense


class IncomeService(FinancialService):
    model = Income
