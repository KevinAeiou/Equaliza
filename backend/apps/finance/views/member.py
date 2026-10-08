from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsFamilyMember
from apps.core.serializers import UserRefSerializer
from apps.families.models import FamilyMember


class FinanceMemberListView(APIView):
    """Membros da família (inclusive quem consulta), para o filtro de despesas e receitas."""

    permission_classes = [IsAuthenticated, IsFamilyMember]

    @extend_schema(responses=UserRefSerializer(many=True))
    def get(self, request):
        memberships = (
            FamilyMember.objects.for_family(request.user.current_family)
            .select_related("user")
            .order_by("user__first_name", "user__email")
        )

        return Response(
            [
                {
                    "id": membership.user_id,
                    "name": membership.user.get_full_name() or membership.user.email,
                }
                for membership in memberships
            ]
        )
