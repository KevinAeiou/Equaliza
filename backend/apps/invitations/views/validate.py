# views/validate.py

from uuid import UUID
from typing import TypedDict, cast

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.invitations.models import Invitation
from apps.invitations.serializers.responses import ValidateInvitationResponseSerializer

from apps.invitations.services import ValidateInvitationTokenService


class ValidateInvitationParams(TypedDict):
    token: UUID


class ValidateInvitationView(APIView):

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "invitation_validate"

    @extend_schema(responses={200: ValidateInvitationResponseSerializer})
    def get(self, request, token):
        params = cast(
            ValidateInvitationParams,
            {"token": token},
        )

        invitation: Invitation = ValidateInvitationTokenService.execute(
            params.get("token"),
        )

        return Response(
            {
                "data": {
                    "email": invitation.email,
                    "family": {
                        "id": invitation.family.pk,
                        "name": invitation.family.name,
                    },
                    "expires_at": invitation.expires_at,
                }
            }
        )
