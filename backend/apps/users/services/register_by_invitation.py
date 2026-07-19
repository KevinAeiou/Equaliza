from typing import cast

from apps.invitations.services import AcceptInvitationService
from apps.invitations.models import Invitation
from apps.users.models import User


class RegisterByInvitationService:

    @staticmethod
    def execute(*, token, data):
        invitation: Invitation = Invitation.objects.get_valid(token)

        data = data.copy()
        data.pop("email", None)

        user = User.objects.create_user(
            email=cast(str, invitation.email),
            current_family=invitation.family,
            **data,
        )

        AcceptInvitationService.execute(
            invitation=invitation,
            user=user,
        )

        return user
