from django.db import transaction

from .register_user import RegisterUserService
from .register_by_invitation import RegisterByInvitationService

class RegisterService:

    @transaction.atomic
    def execute(self, data):
        token = data.pop("token", None)
        data.pop("family_name", None)

        if token:
            return RegisterByInvitationService.execute(
                token=token,
                data=data,
            )
        
        return RegisterUserService.execute(data)
