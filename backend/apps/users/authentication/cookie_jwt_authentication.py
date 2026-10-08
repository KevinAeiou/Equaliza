from django.conf import settings

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken, TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken


class CookieJWTAuthentication(JWTAuthentication):
    """
    Permite autenticação por:

    - Authorization: Bearer <token>
    - Cookie HttpOnly access_token

    Caso o access token esteja expirado, tenta renová-lo
    automaticamente utilizando o refresh token.
    """

    def authenticate(self, request):
        header = self.get_header(request)

        if header is None:
            return None

        raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)

        except InvalidToken as exc:
            if not self._is_expired_token(exc):
                raise

            validated_token = self._refresh_access_token(request)

        return self.get_user(validated_token), validated_token

    def get_user(self, validated_token):
        """Igual ao padrão, mas já traz a família atual (evita uma query por requisição)."""
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken("Token não contém identificação reconhecível do usuário.")

        try:
            user = self.user_model.objects.select_related("current_family").get(
                **{api_settings.USER_ID_FIELD: user_id}
            )
        except self.user_model.DoesNotExist:
            raise AuthenticationFailed("Usuário não encontrado.", code="user_not_found")

        if not user.is_active:
            raise AuthenticationFailed("Usuário inativo.", code="user_inactive")

        return user

    def get_header(self, request):
        """
        Prioriza o Authorization header.
        Caso não exista, utiliza o cookie HttpOnly.
        """
        header = super().get_header(request)

        if header is not None:
            return header

        token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)

        if token:
            return f"Bearer {token}".encode("utf-8")

        return None

    def _refresh_access_token(self, request):
        """
        Tenta renovar o access token utilizando o refresh token.
        """

        refresh_token = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)

        if not refresh_token:
            raise InvalidToken("Refresh token não encontrado.")

        # O middleware lê o HttpRequest: atributos gravados no Request do DRF não chegam a ele.
        http_request = getattr(request, "_request", request)

        try:
            refresh = RefreshToken(refresh_token)

            access_token = refresh.access_token

            if api_settings.ROTATE_REFRESH_TOKENS:
                if api_settings.BLACKLIST_AFTER_ROTATION:
                    refresh.blacklist()

                refresh.set_jti()
                refresh.set_exp()
                refresh.set_iat()

                if hasattr(refresh, "outstand"):
                    refresh.outstand()

                http_request._new_refresh_token = str(refresh)

            new_access = str(access_token)

            request.COOKIES[settings.AUTH_COOKIE_ACCESS] = new_access

            request.META["HTTP_AUTHORIZATION"] = (
                f"Bearer {new_access}"
            )

            http_request._new_access_token = new_access

            return access_token

        except TokenError:
            raise InvalidToken("Refresh token inválido ou expirado.")

    def _is_expired_token(self, exc: InvalidToken) -> bool:
        detail = getattr(exc, "detail", {})

        if isinstance(detail, dict):
            for message in detail.get("messages", []):
                if message.get("message") == "Token is expired":
                    return True

        return False