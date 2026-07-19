from datetime import timedelta
from typing import cast

from django.conf import settings
from rest_framework.response import Response
from rest_framework_simplejwt.settings import api_settings


def set_auth_cookies(
    response: Response,
    access,
    refresh,
):

    refresh_lifetime = cast(
        timedelta,
        api_settings.REFRESH_TOKEN_LIFETIME,
    )

    response.set_cookie(
        key=settings.AUTH_COOKIE_ACCESS,
        value=str(access),
        httponly=True,
        secure=settings.SECURE_COOKIES,
        samesite="Lax",
        path="/",
    )

    response.set_cookie(
        key=settings.AUTH_COOKIE_REFRESH,
        value=str(refresh),
        httponly=True,
        secure=settings.SECURE_COOKIES,
        samesite="Lax",
        path="/",
        max_age=int(refresh_lifetime.total_seconds()),
    )

    return response
