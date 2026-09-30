from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django_filters.rest_framework import DjangoFilterBackend

from apps.finance.serializers import (
    CreateRecurringTransactionSerializer,
    ListRecurringTransactionSerializer,
    UpdateRecurringTransactionSerializer,
)
from apps.finance.services import (
    CreateRecurringTransactionService,
    DeleteRecurringTransactionService,
    ListRecurringTransactionService,
    UpdateRecurringTransactionService,
)
from apps.finance.filters import RecurringTransactionFilter
from apps.core.permissions import IsFamilyMember, IsRecordOwner


class RecurringTransactionViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend]
    filterset_class = RecurringTransactionFilter
    permission_classes = [
        IsAuthenticated,
        IsFamilyMember,
        IsRecordOwner,
    ]

    lookup_field = "pk"

    def get_serializer_class(self):
        if self.action == "create":
            return CreateRecurringTransactionSerializer

        if self.action in ["update", "partial_update"]:
            return UpdateRecurringTransactionSerializer

        return ListRecurringTransactionSerializer

    def get_queryset(self):
        return ListRecurringTransactionService.execute(self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        recurring = CreateRecurringTransactionService.execute(
            user=request.user,
            data=serializer.validated_data,
        )

        return Response(
            ListRecurringTransactionSerializer(recurring).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        recurring = self.get_object()

        serializer = self.get_serializer(
            recurring,
            data=request.data,
            partial=kwargs.get("partial", False),
        )
        serializer.is_valid(raise_exception=True)

        recurring = UpdateRecurringTransactionService.execute(
            recurring=recurring,
            data=serializer.validated_data,
        )

        return Response(ListRecurringTransactionSerializer(recurring).data)

    def destroy(self, request, *args, **kwargs):
        recurring = self.get_object()

        DeleteRecurringTransactionService.execute(
            recurring=recurring,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
