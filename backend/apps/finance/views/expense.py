from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django_filters.rest_framework import DjangoFilterBackend

from apps.finance.serializers import (
    CreateExpenseSerializer,
    ListExpenseSerializer,
    UpdateExpenseSerializer,
)
from apps.finance.services import (
    CreateExpenseService,
    DeleteExpenseService,
    ListExpenseService,
    UpdateExpenseService,
)
from apps.finance.filters import ExpenseFilter
from apps.core.permissions import IsFamilyMember


class ExpenseViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend]
    filterset_class = ExpenseFilter
    permission_classes = [
        IsAuthenticated,
        IsFamilyMember,
    ]

    lookup_field = "pk"

    def get_serializer_class(self):
        if self.action == "create":
            return CreateExpenseSerializer

        if self.action in ["update", "partial_update"]:
            return UpdateExpenseSerializer

        return ListExpenseSerializer

    def get_queryset(self):
        return ListExpenseService.execute(self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        expense = CreateExpenseService.execute(
            user=request.user,
            data=serializer.validated_data,
        )

        return Response(
            ListExpenseSerializer(expense).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        expense = self.get_object()

        serializer = self.get_serializer(
            expense,
            data=request.data,
            partial=kwargs.get("partial", False),
        )
        serializer.is_valid(raise_exception=True)

        expense = UpdateExpenseService.execute(
            expense=expense,
            data=serializer.validated_data,
        )

        return Response(ListExpenseSerializer(expense).data)

    def destroy(self, request, *args, **kwargs):
        expense = self.get_object()

        DeleteExpenseService.execute(
            expense=expense,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
