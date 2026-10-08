from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.finance.models import Expense
from apps.finance.serializers import (
    CreateExpenseSerializer,
    ListExpenseSerializer,
    UpdateExpenseSerializer,
)
from apps.finance.services import ExpenseService
from apps.finance.views.financial import FinancialViewSet


@extend_schema_view(
    create=extend_schema(responses={201: ListExpenseSerializer}),
    update=extend_schema(responses={200: ListExpenseSerializer}),
    partial_update=extend_schema(responses={200: ListExpenseSerializer}),
)
class ExpenseViewSet(FinancialViewSet):
    queryset = Expense.objects.none()  # só para o schema; get_queryset define o real
    service = ExpenseService
    create_serializer_class = CreateExpenseSerializer
    update_serializer_class = UpdateExpenseSerializer
    list_serializer_class = ListExpenseSerializer
