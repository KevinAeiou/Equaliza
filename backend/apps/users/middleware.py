from django.utils.deprecation import MiddlewareMixin

from .utils import set_access_cookie, set_refresh_cookie


class RefreshCookieMiddleware(MiddlewareMixin):

    def process_response(self, request, response):

        access = getattr(request, "_new_access_token", None)

        if access is None:
            return response

        set_access_cookie(response, access)

        # Com a rotação ativa, a renovação também devolve um novo refresh token.
        refresh = getattr(request, "_new_refresh_token", None)

        if refresh is not None:
            set_refresh_cookie(response, refresh)

        return response
