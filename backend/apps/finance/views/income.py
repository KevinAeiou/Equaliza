from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django_filters.rest_framework import DjangoFilterBackend

from apps.finance.serializers import (
    CreateIncomeSerializer,
    ListIncomeSerializer,
    UpdateIncomeSerializer,
)
from apps.finance.services import (
    CreateIncomeService,
    DeleteIncomeService,
    ListIncomeService,
    UpdateIncomeService,
)
from apps.finance.filters import IncomeFilter
from apps.core.permissions import IsFamilyMember


class IncomeViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend]
    filterset_class = IncomeFilter
    permission_classes = [
        IsAuthenticated,
        IsFamilyMember,
    ]

    lookup_field = "pk"

    def get_serializer_class(self):
        if self.action == "create":
            return CreateIncomeSerializer

        if self.action in ["update", "partial_update"]:
            return UpdateIncomeSerializer

        return ListIncomeSerializer

    def get_queryset(self):
        return ListIncomeService.execute(self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        income = CreateIncomeService.execute(
            user=request.user,
            data=serializer.validated_data,
        )

        return Response(
            ListIncomeSerializer(income).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        income = self.get_object()

        serializer = self.get_serializer(
            income,
            data=request.data,
            partial=kwargs.get("partial", False),
        )
        serializer.is_valid(raise_exception=True)

        income = UpdateIncomeService.execute(
            income=income,
            data=serializer.validated_data,
        )

        return Response(ListIncomeSerializer(income).data)

    def destroy(self, request, *args, **kwargs):
        income = self.get_object()

        DeleteIncomeService.execute(
            income=income,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
