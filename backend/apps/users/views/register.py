from typing import cast

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from ..models import User
from ..serializers import RegisterSerializer
from ..utils import set_auth_cookies
from ..services import RegisterService


class RegisterView(APIView):

    def post(self, request):

        serializer = RegisterSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        user = cast(
			User,
			RegisterService().execute(serializer.validated_data)
		)

        refresh = RefreshToken.for_user(user)

        access = refresh.access_token

        response = Response(
            {
                "user": {
                    "id": user.pk,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                }
            },
            status=status.HTTP_201_CREATED,
        )

        return set_auth_cookies(
            response,
            access,
            refresh,
        )
