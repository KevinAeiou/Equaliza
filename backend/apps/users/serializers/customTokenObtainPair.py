from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed

from django.contrib.auth.models import update_last_login

from ..models.user import User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializador para obter um par de token e dados do usuário que usa email e senha para autenticação.
    """

    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=True)
    default_error_messages = {
        "no_active_account": "Usuário desativado.",
        "invalid_credentials": "Usuário ou senha incorretos.",
    }

    def validate(self, attrs):
        """
        Valida as credencias do usuário e retorna um token de acesso e os dados do usuário.
        Args:
            attrs: Dicionário contendo o email e senha.
        Returns:
            dict: Contêm o token de acesso e os dados do usuário.
        Raises:
            AuthenticationFailed: Se as credenciais são inválidas ou o usuário está inativo.
        """

        email = attrs.get("email")
        password = attrs.get("password")

        if not email or not password:
            raise AuthenticationFailed(
                self.default_error_messages["invalid_credentials"]
            )
        try:
            user = User.objects.get(email=email)
            if not user.is_active:
                raise AuthenticationFailed(
                    self.default_error_messages["no_active_account"]
                )

            if not user.check_password(password):
                raise AuthenticationFailed(
                    self.default_error_messages["invalid_credentials"]
                )
        except User.DoesNotExist as exc:
            raise AuthenticationFailed(
                self.default_error_messages["invalid_credentials"]
            ) from exc

        data = super().validate(attrs)

        update_last_login(User, user)

        return data
