from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.finance.serializers import ListExpenseSerializer
from apps.imports.enums import PendingStatus
from apps.imports.filters import PendingTransactionFilter
from apps.imports.models import PendingTransaction
from apps.imports.permissions import StatementImportEnabled
from apps.imports.serializers import (
    BulkPendingSerializer,
    BulkResultSerializer,
    PendingDetailSerializer,
    PendingSerializer,
    RegisterPendingSerializer,
)
from apps.imports.services import RegisterPendingService


class PendingTransactionViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    permission_classes = [IsAuthenticated, StatementImportEnabled]
    filter_backends = [DjangoFilterBackend]
    filterset_class = PendingTransactionFilter
    queryset = PendingTransaction.objects.none()  # só para o schema; get_queryset define o real

    def get_queryset(self):
        queryset = PendingTransaction.objects.filter(owner=self.request.user)

        # Sem filtro de status, a lista mostra só o que ainda está pendente.
        if self.action == "list" and "status" not in self.request.query_params:
            queryset = queryset.filter(status=PendingStatus.PENDING)

        return queryset

    def get_serializer_class(self):
        return PendingDetailSerializer if self.action == "retrieve" else PendingSerializer

    @extend_schema(
        request=RegisterPendingSerializer, responses={201: ListExpenseSerializer},
    )
    @action(detail=True, methods=["post"], url_path="import")
    def register(self, request, pk=None):
        """Registra a pendência como despesa; valor, data e descrição podem ser ajustados."""
        serializer = RegisterPendingSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)

        expense = RegisterPendingService.register_one(
            request.user, int(pk), data.pop("family"), data.pop("category"), **data
        )

        if expense is None:
            raise NotFound()

        return Response(ListExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)

    @extend_schema(request=BulkPendingSerializer, responses={200: BulkResultSerializer})
    @action(detail=False, methods=["post"])
    def bulk(self, request):
        """Registra ou marca como lidas várias pendências de uma vez (mesma família e categoria)."""
        serializer = BulkPendingSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if data["action"] == "import":
            processed = RegisterPendingService.register_many(
                request.user, data["ids"], data["family"], data["category"]
            )
        else:
            processed = RegisterPendingService.dismiss_many(request.user, data["ids"])

        if processed is None:
            raise NotFound()

        return Response({"processed": processed})
