from rest_framework.routers import DefaultRouter

from apps.finance.views import (
    ExpenseViewSet,
    IncomeViewSet,
    FinancialCategoryViewSet,
    RecurringTransactionViewSet,
)

router = DefaultRouter()

router.register("expenses", ExpenseViewSet, basename="expenses")
router.register("income", IncomeViewSet, basename="income")
router.register("recurring", RecurringTransactionViewSet, basename="recurring")
router.register("categories", FinancialCategoryViewSet, basename="categories")

urlpatterns = router.urls
