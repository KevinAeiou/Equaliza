from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsFamilyMember, IsRecordOwner
from apps.finance.filters import FinancialFilter


# CRUD de receitas e despesas; as subclasses definem o service e os serializers.
# (Comentário, e não docstring, para não virar descrição na documentação da API.)
class FinancialViewSet(viewsets.ModelViewSet):
    service = None
    create_serializer_class = None
    update_serializer_class = None
    list_serializer_class = None

    filter_backends = [DjangoFilterBackend]
    filterset_class = FinancialFilter
    permission_classes = [
        IsAuthenticated,
        IsFamilyMember,
        IsRecordOwner,
    ]

    lookup_field = "pk"

    def get_serializer_class(self):
        if self.action == "create":
            return self.create_serializer_class

        if self.action in ["update", "partial_update"]:
            return self.update_serializer_class

        return self.list_serializer_class

    def get_queryset(self):
        return self.service.list(self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        instance = self.service.create(
            user=request.user,
            data=serializer.validated_data,
        )

        return Response(
            self.list_serializer_class(instance).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=kwargs.get("partial", False),
        )
        serializer.is_valid(raise_exception=True)

        instance = self.service.update(
            instance=instance,
            data=serializer.validated_data,
        )

        return Response(self.list_serializer_class(instance).data)

    def destroy(self, request, *args, **kwargs):
        self.service.delete(self.get_object())

        return Response(status=status.HTTP_204_NO_CONTENT)
