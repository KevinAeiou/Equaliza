from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from apps.core.serializers import DetailSerializer
from ..serializers.password_reset import (
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
)
from ..services.password_reset import (
    PasswordResetConfirmService,
    PasswordResetRequestService,
)


class PasswordResetThrottle(AnonRateThrottle):
    scope = "password_reset"


class PasswordResetRequestView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetThrottle]

    @extend_schema(request=PasswordResetRequestSerializer, responses={200: DetailSerializer})
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        PasswordResetRequestService().execute(serializer.validated_data["email"])

        return Response(
            {
                "detail": "Se o e-mail estiver cadastrado, você receberá "
                "as instruções para redefinir a senha."
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetThrottle]

    @extend_schema(request=PasswordResetConfirmSerializer, responses={200: DetailSerializer})
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        PasswordResetConfirmService().execute(**serializer.validated_data)

        return Response(
            {"detail": "Senha redefinida com sucesso."},
            status=status.HTTP_200_OK,
        )
