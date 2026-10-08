from rest_framework.routers import SimpleRouter

from apps.settlements.views import SettlementViewSet

router = SimpleRouter()
router.register("", SettlementViewSet, basename="settlements")

urlpatterns = router.urls
