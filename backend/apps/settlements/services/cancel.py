from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.families.models import Family, FamilyMember
from apps.settlements.enums import SettlementStatus
from apps.settlements.models import Settlement


class CancelSettlementService:
    @staticmethod
    def execute(*, user, settlement_id):
        """Estorna um acerto (não apaga: fica no histórico). Só responsável ou administrador."""
        family_id = user.current_family_id

        if family_id is None:
            raise PermissionDenied("Você precisa fazer parte de uma família para estornar acertos.")

        with transaction.atomic():
            family = Family.objects.select_for_update().get(pk=family_id)

            if not FamilyMember.objects.is_administrator(family=family, user=user):
                raise PermissionDenied("Apenas responsáveis e administradores podem estornar acertos.")

            settlement = get_object_or_404(
                Settlement.objects.select_for_update(), pk=settlement_id, family=family
            )

            if settlement.status == SettlementStatus.CANCELLED:
                raise ValidationError("Este acerto já foi estornado.")

            settlement.status = SettlementStatus.CANCELLED
            settlement.cancelled_at = timezone.now()
            settlement.cancelled_by = user
            settlement.updated_by = user
            settlement.save()

        return settlement
