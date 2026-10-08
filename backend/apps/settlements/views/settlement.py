from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsFamilyAdministrator, IsFamilyMember
from apps.settlements.models import Settlement
from apps.settlements.serializers import (
    BalanceParamsSerializer,
    BalanceSerializer,
    CreateSettlementSerializer,
    ListSettlementParamsSerializer,
    ListSettlementSerializer,
)
from apps.settlements.services import (
    BalanceService,
    CancelSettlementService,
    CreateSettlementService,
    ListSettlementService,
)


@extend_schema_view(
    list=extend_schema(parameters=[ListSettlementParamsSerializer]),
    create=extend_schema(request=CreateSettlementSerializer, responses={201: ListSettlementSerializer}),
)
class SettlementViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """Acertos de contas entre membros: saldo, pagamentos, histórico e estorno."""

    permission_classes = [IsAuthenticated, IsFamilyMember]
    serializer_class = ListSettlementSerializer
    queryset = Settlement.objects.none()  # só para o schema; get_queryset define o real

    def get_queryset(self):
        params = ListSettlementParamsSerializer(data=self.request.query_params)
        params.is_valid(raise_exception=True)

        return ListSettlementService.execute(self.request.user, **params.validated_data)

    def get_permissions(self):
        if self.action == "cancel":
            return [IsAuthenticated(), IsFamilyAdministrator()]

        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        serializer = CreateSettlementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        settlement = CreateSettlementService.execute(
            user=request.user,
            receiver_id=data["receiver"],
            amount=data["amount"],
            month=data["month"],
            note=data.get("note", ""),
            paid_at=data.get("paid_at"),
        )

        return Response(ListSettlementSerializer(settlement).data, status=status.HTTP_201_CREATED)

    @extend_schema(parameters=[BalanceParamsSerializer], responses=BalanceSerializer)
    @action(detail=False, methods=["get"])
    def balance(self, request):
        params = BalanceParamsSerializer(data=request.query_params)
        params.is_valid(raise_exception=True)
        month = params.validated_data.get("month") or timezone.localdate().replace(day=1)

        family = request.user.current_family

        if family is None:
            start = month.strftime("%Y-%m")
            empty = {"month": start, "settlement_start": start, "my_balance": 0, "members": [], "suggestions": []}

            return Response(BalanceSerializer(empty).data)

        result = BalanceService.compute(family, month, request.user)

        return Response(BalanceSerializer(result).data)

    @extend_schema(request=None, responses=ListSettlementSerializer)
    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        settlement = CancelSettlementService.execute(user=request.user, settlement_id=pk)

        return Response(ListSettlementSerializer(settlement).data)
