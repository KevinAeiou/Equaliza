from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.finance.models import Income
from apps.finance.serializers import (
    CreateIncomeSerializer,
    ListIncomeSerializer,
    UpdateIncomeSerializer,
)
from apps.finance.services import IncomeService
from apps.finance.views.financial import FinancialViewSet


@extend_schema_view(
    create=extend_schema(responses={201: ListIncomeSerializer}),
    update=extend_schema(responses={200: ListIncomeSerializer}),
    partial_update=extend_schema(responses={200: ListIncomeSerializer}),
)
class IncomeViewSet(FinancialViewSet):
    queryset = Income.objects.none()  # só para o schema; get_queryset define o real
    service = IncomeService
    create_serializer_class = CreateIncomeSerializer
    update_serializer_class = UpdateIncomeSerializer
    list_serializer_class = ListIncomeSerializer
