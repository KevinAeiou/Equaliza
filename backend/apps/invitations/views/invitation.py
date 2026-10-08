from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsFamilyAdministrator
from apps.invitations.models import Invitation
from apps.invitations.serializers import (
    CreateInvitationSerializer,
    ListInvitationSerializer,
)
from apps.invitations.services import (
    CreateInvitationService,
    DeleteInvitationService,
    ListInvitationService,
)


@extend_schema_view(
    create=extend_schema(responses={201: ListInvitationSerializer}),
    # Estas rotas existem no router, mas respondem 405: ficam fora do schema.
    retrieve=extend_schema(exclude=True),
    update=extend_schema(exclude=True),
    partial_update=extend_schema(exclude=True),
)
class InvitationViewSet(viewsets.ModelViewSet):
    queryset = Invitation.objects.none()  # só para o schema; get_queryset define o real
    permission_classes = [
        IsAuthenticated,
        IsFamilyAdministrator,
    ]

    lookup_field = "pk"

    def get_serializer_class(self):
        if self.action == "create":
            return CreateInvitationSerializer

        return ListInvitationSerializer

    def get_queryset(self):
        return ListInvitationService.execute(self.request.user)

    def retrieve(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        invitation = CreateInvitationService.execute(
            user=request.user,
            email=serializer.validated_data["email"],
        )

        return Response(
            ListInvitationSerializer(invitation).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def partial_update(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        invitation = self.get_object()

        DeleteInvitationService.execute(
            invitation=invitation,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
