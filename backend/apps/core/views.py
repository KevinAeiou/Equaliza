import logging

from django.db import connection
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """Verificação de saúde para o orquestrador (Render/Docker): confirma que o banco responde."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception:
            logger.exception("Health check: banco de dados indisponível.")

            return Response({"status": "unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response({"status": "ok"})
