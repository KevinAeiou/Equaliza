class DeleteInvitationService:

    @staticmethod
    def execute(*, invitation):
        invitation.delete()