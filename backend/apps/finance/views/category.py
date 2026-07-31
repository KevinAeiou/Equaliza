from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsFamilyAdministrator

from apps.finance.serializers import (
    CreateFinancialCategorySerializer,
    UpdateFinancialCategorySerializer,
    ListFinancialCategorySerializer,
)
from apps.finance.services import (
    ListFinancialCategoryService,
    CreateFinancialCategoryService,
    UpdateFinancialCategoryService,
    DeleteFinancialCategoryService,
)
from apps.finance.filters import CategoryFilter


class FinancialCategoryViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend]
    filterset_class = CategoryFilter
    permission_classes = [
        IsAuthenticated,
        IsFamilyAdministrator,
    ]

    lookup_field = "pk"

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [
                IsAuthenticated,
                IsFamilyAdministrator,
            ]

        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action == "create":
            return CreateFinancialCategorySerializer

        if self.action in ["update", "partial_update"]:
            return UpdateFinancialCategorySerializer

        return ListFinancialCategorySerializer

    def get_queryset(self):
        return ListFinancialCategoryService.execute(self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        category = CreateFinancialCategoryService.execute(
            user=request.user,
            data=serializer.validated_data,
        )

        return Response(
            ListFinancialCategorySerializer(category).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        category = self.get_object()

        serializer = self.get_serializer(
            category,
            data=request.data,
            partial=kwargs.get("partial", False),
        )
        serializer.is_valid(raise_exception=True)

        category = UpdateFinancialCategoryService.execute(
            category=category,
            data=serializer.validated_data,
        )

        return Response(ListFinancialCategorySerializer(category).data)

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()

        DeleteFinancialCategoryService.execute(category)

        return Response(status=status.HTTP_204_NO_CONTENT)
