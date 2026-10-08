from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.finance.views import (
    ExpenseViewSet,
    IncomeViewSet,
    FinancialCategoryViewSet,
    RecurringTransactionViewSet,
    FinanceMemberListView,
)

router = DefaultRouter()

router.register("expenses", ExpenseViewSet, basename="expenses")
router.register("income", IncomeViewSet, basename="income")
router.register("recurring", RecurringTransactionViewSet, basename="recurring")
router.register("categories", FinancialCategoryViewSet, basename="categories")

urlpatterns = [
    path("members/", FinanceMemberListView.as_view(), name="finance-members"),
    *router.urls,
]
