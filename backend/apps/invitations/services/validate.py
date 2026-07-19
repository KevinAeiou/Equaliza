from rest_framework.exceptions import ValidationError

from apps.users.models import User
from apps.invitations.models import Invitation


class ValidateInvitationService:

    @staticmethod
    def execute(user, email):
        family = user.current_family

        if user.email.lower() == email.lower():
            raise ValidationError(
                {"email": "Você não pode enviar um convite para si mesmo."}
            )

        if User.objects.filter(email__iexact=email).exists():
            raise ValidationError(
                {"email": "Já existe um usuário cadastrado com este e-mail."}
            )

        if Invitation.objects.pending_for_email(
            family,
            email,
        ).exists():
            raise ValidationError(
                {"email": "Já existe um convite pendente para este e-mail."}
            )
