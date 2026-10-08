from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.invitations.serializers.responses import AcceptInvitationResponseSerializer
from apps.invitations.services import JoinFamilyByInvitationService


class AcceptInvitationView(APIView):
    """Permite que um usuário já cadastrado entre em uma família pelo link."""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses={200: AcceptInvitationResponseSerializer})
    def post(self, request, token):
        family = JoinFamilyByInvitationService.execute(
            token=token,
            user=request.user,
        )

        return Response(
            {"data": {"family": {"id": family.pk, "name": family.name}}},
            status=status.HTTP_200_OK,
        )
