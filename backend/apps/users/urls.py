from django.urls import path

from .views import (
    LoginView,
    LogoutView,
    MeView,
    RegisterView,
    ProfileView,
    CurrentFamilyView,
)

urlpatterns = [
    path(
        "login/",
        LoginView.as_view(),
        name="login",
    ),
    path(
        "logout/",
        LogoutView.as_view(),
        name="logout",
    ),
    path(
        "me/",
        MeView.as_view(),
        name="me",
    ),
    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),
    path(
        "profile/",
        ProfileView.as_view(),
        name="profile",
    ),
    path(
        "current/",
        CurrentFamilyView.as_view(),
        name="current",
    ),
]
