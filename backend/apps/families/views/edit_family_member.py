from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsFamilyAdministrator
from apps.families.serializers import FamilyMemberStatusSerializer
from apps.families.services import ToggleFamilyMemberStatusService


class FamilyMemberStatusView(generics.GenericAPIView):
    permission_classes = (
        IsAuthenticated,
        IsFamilyAdministrator,
    )
    serializer_class = FamilyMemberStatusSerializer

    def patch(self, request, *args, **kwargs):
        member = ToggleFamilyMemberStatusService.execute(
            family=request.user.current_family,
            member_id=kwargs["pk"],
        )

        serializer = self.get_serializer(member)

        return Response(serializer.data)