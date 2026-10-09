from django.conf import settings
from django.http import HttpResponseNotAllowed, HttpResponseNotFound

from apps.core.current_user import set_current_user


class CurrentUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            set_current_user(request.user)
        else:
            set_current_user(None)

        response = self.get_response(request)

        set_current_user(None)

        return response


class RequestScopeMiddleware:
    """Recusa cedo qualquer requisição fora do escopo da API.

    Só passam caminhos sob `REQUEST_SCOPE_PATH_PREFIXES` e métodos HTTP em
    `REQUEST_SCOPE_ALLOWED_METHODS`. O resto (scanners procurando /.env, /wp-login.php,
    métodos como TRACE...) é rejeitado antes de chegar em autenticação, banco ou views.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method not in settings.REQUEST_SCOPE_ALLOWED_METHODS:
            return HttpResponseNotAllowed(settings.REQUEST_SCOPE_ALLOWED_METHODS)

        if not request.path_info.startswith(tuple(settings.REQUEST_SCOPE_PATH_PREFIXES)):
            return HttpResponseNotFound()

        return self.get_response(request)
