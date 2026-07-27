from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .viewsets import (
    FamilyViewSet,
    FamilyMemberViewSet,
)

router = DefaultRouter()

router.register(
    "members",
    FamilyMemberViewSet,
    basename="family-member",
)

router.register(
    "",
    FamilyViewSet,
    basename="family",
)

urlpatterns = [
    path(
        "",
        include(router.urls),
    ),
]
