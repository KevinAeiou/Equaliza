from typing import cast

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.users.models import User
from apps.users.serializers import ProfileSerializer


class ProfileView(generics.UpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self) -> User:
        return cast(User, self.request.user)
