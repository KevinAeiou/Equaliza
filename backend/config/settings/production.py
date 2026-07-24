from .base import *

DEBUG = False

ALLOWED_HOSTS: list[str] = env.str(
    "ALLOWED_HOSTS",
    default="",
).split(",")

CORS_ALLOWED_ORIGINS: list[str] = env.str(
    "CORS_ALLOWED_ORIGINS",
    default="",
).split(",")

CSRF_TRUSTED_ORIGINS: list[str] = env.str(
    "CSRF_TRUSTED_ORIGINS",
    default="",
).split(",")

SECURE_SSL_REDIRECT = True

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

STATIC_ROOT = BASE_DIR / "staticfiles"