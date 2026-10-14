from rest_framework.routers import DefaultRouter

from apps.imports.views import CsvMappingViewSet, ImportBatchViewSet, PendingTransactionViewSet

router = DefaultRouter()

router.register("imports/csv-mappings", CsvMappingViewSet, basename="csv-mappings")
router.register("imports", ImportBatchViewSet, basename="imports")
router.register("pending-transactions", PendingTransactionViewSet, basename="pending-transactions")

urlpatterns = router.urls
