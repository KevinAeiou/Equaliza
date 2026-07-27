from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.families.serializers import (
    CreateFamilySerializer,
    ListFamilySerializer,
    UpdateFamilySerializer,
)
from apps.families.services import (
    CreateFamilyService,
    DeleteFamilyService,
    ListFamilyService,
    UpdateFamilyService,
)


class FamilyViewSet(viewsets.ModelViewSet):
    permission_classes = [
        IsAuthenticated,
    ]

    lookup_field = "pk"

    def get_serializer_class(self):
        if self.action == "create":
            return CreateFamilySerializer

        if self.action in ["update", "partial_update"]:
            return UpdateFamilySerializer

        return ListFamilySerializer

    def get_queryset(self):
        return ListFamilyService.execute(
            user=self.request.user,
        )

    def retrieve(self, request, *args, **kwargs):
        family = self.get_object()

        return Response(
            ListFamilySerializer(family).data,
            status=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        family = CreateFamilyService.execute(
            user=request.user, name=serializer.validated_data["name"]
        )

        return Response(
            ListFamilySerializer(family).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        family = self.get_object()

        serializer = self.get_serializer(
            family,
            data=request.data,
        )
        serializer.is_valid(raise_exception=True)

        family = UpdateFamilyService.execute(
            family=family,
            user=request.user,
            name=serializer.validated_data["name"],
        )

        return Response(
            ListFamilySerializer(family).data,
            status=status.HTTP_200_OK,
        )

    def partial_update(self, request, *args, **kwargs):
        family = self.get_object()

        serializer = self.get_serializer(
            family,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)

        family = UpdateFamilyService.execute(
            family=family,
            user=request.user,
            name=serializer.validated_data["name"],
        )

        return Response(
            ListFamilySerializer(family).data,
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        family = self.get_object()

        DeleteFamilyService.execute(
            family=family,
            user=request.user,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
