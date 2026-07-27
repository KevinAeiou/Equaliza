from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsFamilyAdministrator
from apps.families.serializers import (
    FamilyMemberStatusSerializer,
    ListFamilyMemberSerializer,
)
from apps.families.services import (
    DeleteFamilyMemberService,
    ListFamilyMemberService,
    ToggleFamilyMemberStatusService,
)


class FamilyMemberViewSet(
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [
        IsAuthenticated,
        IsFamilyAdministrator,
    ]

    lookup_field = "pk"

    def get_queryset(self):
        return ListFamilyMemberService.execute(
            self.request.user,
        )

    def get_serializer_class(self):
        if self.action == "status":
            return FamilyMemberStatusSerializer

        return ListFamilyMemberSerializer

    def destroy(self, request, *args, **kwargs):
        DeleteFamilyMemberService().execute(
            family=request.user.current_family,
            member_id=kwargs["pk"],
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=True,
        methods=["patch"],
        url_path="status",
    )
    def status(self, request, *args, **kwargs):
        member = ToggleFamilyMemberStatusService().execute(
            user=request.user,
            member_id=kwargs["pk"],
        )

        serializer = self.get_serializer(member)

        return Response(serializer.data)
