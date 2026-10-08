from django.apps import AppConfig


class UsersConfig(AppConfig):
    name = 'apps.users'

    def ready(self):
        # Registra a extensão que descreve a autenticação por cookie no schema OpenAPI.
        from .authentication import schema  # noqa: F401
