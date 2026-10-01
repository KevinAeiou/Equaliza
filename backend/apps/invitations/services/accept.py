from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.families.enums import FamilyRole
from apps.families.models import FamilyMember


class AcceptInvitationService:

    @staticmethod
    def execute(*, invitation, user):

        FamilyMember.objects.create(
            family=invitation.family,
            user=user,
            role=FamilyRole.MEMBER,
            created_by=user,
            updated_by=user,
        )

        user.current_family = invitation.family
        user.save(update_fields=["current_family"])

        invitation.accepted_at = timezone.now()
        invitation.is_active = False
        invitation.updated_by = user
        invitation.save(
            update_fields=[
                "accepted_at",
                "is_active",
                "updated_by",
            ]
        )


class JoinFamilyByInvitationService:
    """Faz um usuário já cadastrado entrar na família de um convite."""

    @staticmethod
    @transaction.atomic
    def execute(*, token, user):
        from apps.invitations.models import Invitation

        Invitation.objects.select_for_update().filter(token=token).first()
        invitation = Invitation.objects.get_valid(token)

        if invitation.email and invitation.email.lower() != user.email.lower():
            raise PermissionDenied("Este convite foi enviado para outro e-mail.")

        if FamilyMember.objects.filter(
            family=invitation.family,
            user=user,
        ).exists():
            raise ValidationError({"token": "Você já faz parte desta família."})

        AcceptInvitationService.execute(invitation=invitation, user=user)

        return invitation.family
