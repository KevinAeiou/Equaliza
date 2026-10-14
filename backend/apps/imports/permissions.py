from django.conf import settings
from rest_framework.exceptions import NotFound
from rest_framework.permissions import BasePermission


class StatementImportEnabled(BasePermission):
    """Com a flag desligada a funcionalidade nem aparece: as rotas respondem 404."""

    def has_permission(self, request, view):
        if not settings.STATEMENT_IMPORT_ENABLED:
            raise NotFound()

        return True
