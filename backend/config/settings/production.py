from django.core.exceptions import ImproperlyConfigured

from .base import *

DEBUG = False

# Em produção a chave e os hosts vêm obrigatoriamente do ambiente: sem eles a aplicação
# não sobe, em vez de rodar com o valor inseguro padrão ou aceitando qualquer host.
SECRET_KEY = env.str("SECRET_KEY")

if SECRET_KEY.startswith("django-insecure"):
    raise ImproperlyConfigured("SECRET_KEY de produção não pode ser a chave insegura de desenvolvimento.")


def env_list(name, **kwargs):
    """Lista separada por vírgulas, ignorando espaços e itens vazios."""
    return [item.strip() for item in env.list(name, **kwargs) if item.strip()]


ALLOWED_HOSTS: list[str] = env_list("ALLOWED_HOSTS")

CORS_ALLOWED_ORIGINS: list[str] = env_list("CORS_ALLOWED_ORIGINS", default=[])

CSRF_TRUSTED_ORIGINS: list[str] = env_list("CSRF_TRUSTED_ORIGINS", default=[])

SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

STATIC_ROOT = BASE_DIR / "staticfiles"

# As recorrências são geradas pelo Cron Job do Render (render.yaml) e, de forma preguiçosa,
# ao listar receitas/despesas. O agendador interno em thread está obsoleto: desligado por
# padrão (RECURRING_SCHEDULER_ENABLED=True religa) e será removido em uma versão futura.
