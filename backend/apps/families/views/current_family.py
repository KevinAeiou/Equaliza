from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import FamilyMember


class CurrentFamilyView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        family_id = request.data.get("family_id")

        if not family_id:
            return Response(
                {"family_id": ["Este campo é obrigatório."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership = FamilyMember.objects.get_active_membership(
            request.user,
            family_id,
        )

        if membership is None:
            return Response(
                {"detail": "Você não pertence a esta família."},
                status=status.HTTP_404_NOT_FOUND,
            )

        request.user.current_family = membership.family
        request.user.save(update_fields=["current_family"])

        return Response(status=status.HTTP_204_NO_CONTENT)
