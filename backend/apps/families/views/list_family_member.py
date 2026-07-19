from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsFamilyAdministrator
from apps.families.serializers import ListFamilyMemberSerializer
from apps.families.services import (
    ListFamilyMemberService,
)


class FamilyMemberListView(generics.ListAPIView):
    serializer_class = ListFamilyMemberSerializer
    permission_classes = [
        IsAuthenticated,
        IsFamilyAdministrator,
    ]

    def get_queryset(self):
        return ListFamilyMemberService().execute(self.request.user)
