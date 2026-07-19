from apps.invitations.models import Invitation


class ValidateInvitationTokenService:

    @staticmethod
    def execute(token):
        return Invitation.objects.get_valid(token)
