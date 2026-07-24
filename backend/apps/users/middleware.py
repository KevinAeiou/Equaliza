from django.conf import settings
from django.utils.deprecation import MiddlewareMixin


class RefreshCookieMiddleware(MiddlewareMixin):

    def process_response(self, request, response):

        access = getattr(request, "_new_access_token", None)

        if access is None:
            return response

        response.set_cookie(
            key=settings.AUTH_COOKIE_ACCESS,
            value=access,
            httponly=True,
            secure=settings.SECURE_COOKIES,
            samesite="None",
            path="/",
        )

        return response
