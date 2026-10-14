from django.db import models

from apps.imports.crypto import decrypt, encrypt


class EncryptedTextField(models.TextField):
    """Texto cifrado em repouso (Fernet). Vazio e nulo ficam como estão."""

    def get_prep_value(self, value):
        value = super().get_prep_value(value)

        return encrypt(value) if value else value

    def from_db_value(self, value, expression, connection):
        return decrypt(value) if value else value
