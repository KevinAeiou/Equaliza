from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsFamilyAdministrator
from apps.families.services import (
    DeleteFamilyMemberService,
)


class FamilyMemberDeleteView(generics.DestroyAPIView):
    permission_classes = [
        IsAuthenticated,
        IsFamilyAdministrator,
    ]

    def delete(self, request, *args, **kwargs):
        DeleteFamilyMemberService().execute(
            family=request.user.current_family,
            member_id=kwargs["pk"],
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
