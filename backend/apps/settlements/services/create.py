from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.families.models import Family, FamilyMember
from apps.settlements.calculations import ZERO
from apps.settlements.models import Settlement
from apps.settlements.periods import add_months
from apps.settlements.services.balance import BalanceService


class CreateSettlementService:
    @staticmethod
    def execute(*, user, receiver_id, amount, month, note="", paid_at=None):
        """Registra o pagamento do usuário (devedor) a um membro com crédito.

        Roda sob lock da família, para pagamentos simultâneos não estourarem o saldo.
        """
        family_id = user.current_family_id

        if family_id is None:
            raise PermissionDenied("Você precisa fazer parte de uma família para registrar acertos.")

        today = timezone.localdate()
        paid_at = paid_at or today

        with transaction.atomic():
            family = Family.objects.select_for_update().get(pk=family_id)

            if not FamilyMember.objects.is_member(family=family, user=user):
                raise PermissionDenied("Você não faz parte desta família.")

            if receiver_id == user.id:
                raise ValidationError({"receiver": "Você não pode pagar a si mesmo."})

            if not FamilyMember.objects.filter(family=family, user_id=receiver_id).exists():
                raise ValidationError({"receiver": "O recebedor não faz parte da família."})

            if amount is None or amount <= 0:
                raise ValidationError({"amount": "O valor deve ser maior que zero."})

            if month < family.settlement_start:
                raise ValidationError({"month": "Esse mês é anterior ao início do acerto de contas."})

            if month > today.replace(day=1):
                raise ValidationError({"month": "Não é possível acertar um mês futuro."})

            if paid_at > today:
                raise ValidationError({"paid_at": "A data do pagamento não pode ser futura."})

            # O limite vale tanto no mês acertado quanto no mês atual: um pagamento de mês antigo
            # não pode ultrapassar o que ainda está em aberto hoje.
            snapshots = [BalanceService.user_balances(family, month)]
            if month < today.replace(day=1):
                snapshots.append(BalanceService.user_balances(family, today.replace(day=1)))

            debt = min(-snapshot.get(user.id, ZERO) for snapshot in snapshots)
            credit = min(snapshot.get(receiver_id, ZERO) for snapshot in snapshots)
            limit = max(min(debt, credit), ZERO)

            if limit <= 0:
                raise ValidationError({"amount": "Não há saldo a acertar entre vocês neste mês."})

            if amount > limit:
                raise ValidationError({"amount": f"O valor máximo para este pagamento é R$ {limit}."})

            settlement = Settlement.objects.create(
                family=family,
                payer=user,
                receiver_id=receiver_id,
                amount=amount,
                reference_month=month,
                paid_at=paid_at,
                note=note,
                created_by=user,
                updated_by=user,
            )

            balances = BalanceService.user_balances(family, month)
            remaining = max(-balances.get(user.id, ZERO), ZERO)

            settlement.remaining_after = remaining
            settlement.carried_to = add_months(month, 1) if remaining > 0 else None
            settlement.save(update_fields=["remaining_after", "carried_to"])

        return settlement


