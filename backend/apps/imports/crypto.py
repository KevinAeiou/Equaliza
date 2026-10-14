from cryptography.fernet import Fernet, MultiFernet
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


def get_cipher():
    keys = [key.strip() for key in settings.IMPORT_ENCRYPTION_KEYS if key.strip()]

    if not keys:
        raise ImproperlyConfigured("Defina IMPORT_ENCRYPTION_KEYS para a importação de extratos.")

    return MultiFernet([Fernet(key) for key in keys])


def encrypt(text):
    return get_cipher().encrypt(text.encode("utf-8")).decode("ascii")


def decrypt(token):
    return get_cipher().decrypt(token.encode("ascii")).decode("utf-8")
