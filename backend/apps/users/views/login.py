from typing import Any, cast

from rest_framework_simplejwt.views import TokenObtainPairView
from ..serializers.customTokenObtainPair import CustomTokenObtainPairSerializer
from ..utils import set_auth_cookies

class LoginView(TokenObtainPairView):
    """
    Endpoint para obtenção de tokens JWT que utiliza email como credencial.

    Estende a TokenObtainPairView padrão para:
    - Utilizar email em vez de username como credencial principal.
    - Retornar dados adicionais do usuário na resposta.
    - Fornecer mensagens de erro personalizadas
    Returns:
        dict: Contêm:
        - refresh (str): Token de refresh para obter novos tokens de acesso.
        - access (str): Token de acesso para requisições autenticadas.
        - user (dict): Informações básicas do usuário (id, username, email).
    """

    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        data = cast(dict[str, Any], response.data)

        access = data.pop("access")
        refresh = data.pop("refresh")

        return set_auth_cookies(
            response,
            access,
            refresh,
        )
