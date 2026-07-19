from datetime import timedelta

from django.utils import timezone

from apps.invitations.models import Invitation
from apps.invitations.services.email import InvitationEmailService


class CreateInvitationService:

    @staticmethod
    def execute(user, email):

        invitation = Invitation.objects.create(
            family=user.current_family,
            email=email,
            expires_at=timezone.now() + timedelta(days=7),
            created_by=user,
            updated_by=user,
        )

        InvitationEmailService.send(invitation)

        return invitation
