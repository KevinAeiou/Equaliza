from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.invitations.views import (
    AcceptInvitationView,
    InvitationViewSet,
    ValidateInvitationView,
)

router = DefaultRouter()

router.register(
    "",
    InvitationViewSet,
    basename="invitation",
)

urlpatterns = [
    path(
        "<uuid:token>/accept/",
        AcceptInvitationView.as_view(),
        name="accept-invitation",
    ),
    path(
        "",
        include(router.urls),
    ),
    path(
        "<uuid:token>/validate/",
        ValidateInvitationView.as_view(),
        name="validate-invitation",
    ),
]
