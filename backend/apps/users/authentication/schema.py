from django.conf import settings
from drf_spectacular.extensions import OpenApiAuthenticationExtension


class CookieJWTAuthenticationScheme(OpenApiAuthenticationExtension):
    """Descreve no OpenAPI a autenticação por cookie HttpOnly (ou `Authorization: Bearer`)."""

    target_class = "apps.users.authentication.cookie_jwt_authentication.CookieJWTAuthentication"
    name = "cookieAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "apiKey",
            "in": "cookie",
            "name": settings.AUTH_COOKIE_ACCESS,
            "description": (
                "Access token JWT em cookie HttpOnly. O header `Authorization: Bearer <token>` "
                "também é aceito."
            ),
        }
