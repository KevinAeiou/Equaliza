from django.test import SimpleTestCase
from django.urls import URLPattern, URLResolver, get_resolver
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

# Únicas rotas que podem ser acessadas sem autenticação. Qualquer outra rota pública
# precisa ser adicionada aqui de propósito (e revisada) antes de ir para produção.
PUBLIC_ROUTES = {
    "api/health/",
    "api/login/",
    "api/register/",
    "api/password-reset/",
    "api/password-reset/confirm/",
    "api/invitations/<uuid:token>/validate/",
}


def iter_api_views(patterns=None, prefix=""):
    patterns = get_resolver().url_patterns if patterns is None else patterns

    for pattern in patterns:
        route = prefix + str(pattern.pattern)

        if isinstance(pattern, URLResolver):
            yield from iter_api_views(pattern.url_patterns, route)
            continue

        if not isinstance(pattern, URLPattern):
            continue

        view_class = getattr(pattern.callback, "cls", None) or getattr(
            pattern.callback, "view_class", None
        )

        if view_class and issubclass(view_class, APIView):
            yield route, view_class


def is_public(view_class):
    permissions = view_class.permission_classes

    return not permissions or any(issubclass(permission, AllowAny) for permission in permissions)


class PublicRoutesTests(SimpleTestCase):
    def test_only_allowed_routes_are_public(self):
        public = {route for route, view_class in iter_api_views() if is_public(view_class)}

        self.assertEqual(public, PUBLIC_ROUTES)
