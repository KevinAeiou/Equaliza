from apps.invitations.models import Invitation


class ListInvitationService:

    @staticmethod
    def execute(user):
        return Invitation.objects.filter(family=user.current_family).order_by(
            "-created_at"
        )
