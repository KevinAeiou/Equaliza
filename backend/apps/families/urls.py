from django.urls import path

from .views import (
    CurrentFamilyView,
    FamilyMemberListView,
    FamilyMemberDeleteView,
	FamilyMemberStatusView,
)

urlpatterns = [
    path("current/", CurrentFamilyView.as_view(), name="current"),
    path(
        "members/",
        FamilyMemberListView.as_view(),
        name="members-list",
    ),
    path(
        "members/<int:pk>/",
        FamilyMemberDeleteView.as_view(),
        name="members-delete",
    ),
    path(
        "members/<int:pk>/status/",
        FamilyMemberStatusView.as_view(),
        name="members-status",
    ),
]
