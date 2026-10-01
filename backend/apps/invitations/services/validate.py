from rest_framework.exceptions import ValidationError

from apps.families.models import FamilyMember
from apps.invitations.models import Invitation


class ValidateInvitationService:

    @staticmethod
    def execute(user, email):
        family = user.current_family

        if user.email.lower() == email.lower():
            raise ValidationError(
                {"email": "Você não pode enviar um convite para si mesmo."}
            )

        if FamilyMember.objects.filter(
            family=family,
            user__email__iexact=email,
        ).exists():
            raise ValidationError({"email": "Este usuário já faz parte da família."})

        if Invitation.objects.pending_for_email(
            family,
            email,
        ).exists():
            raise ValidationError(
                {"email": "Já existe um convite pendente para este e-mail."}
            )
