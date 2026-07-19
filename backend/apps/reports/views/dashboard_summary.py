from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsFamilyMember
from apps.reports.serializers import DashboardSummarySerializer
from apps.reports.services import DashboardSummaryService


class DashboardSummaryView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsFamilyMember,
    ]

    def get(self, request):
        data = DashboardSummaryService.execute(
            request.user,
            filters=request.query_params,
		)

        serializer = DashboardSummarySerializer(data)

        return Response(serializer.data)