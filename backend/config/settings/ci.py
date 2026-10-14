from .base import *

DEBUG = False

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Chave de teste (Fernet); nunca usar fora do CI.
IMPORT_ENCRYPTION_KEYS = ["Zm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyMTI="]

# Os testes enviam vários arquivos com o mesmo usuário; o limite real é testado à parte.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_THROTTLE_RATES": {**REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"], "import_upload": "1000/hour"},
}
