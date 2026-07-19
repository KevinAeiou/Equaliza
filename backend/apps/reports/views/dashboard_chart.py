from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsFamilyMember
from apps.reports.serializers import DashboardChartSerializer
from apps.reports.services import DashboardChartsService


class DashboardChartsView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsFamilyMember,
    ]

    def get(self, request):
        charts = DashboardChartsService.execute(
            request.user,
            request.query_params,
        )

        serializer = DashboardChartSerializer(charts)

        return Response(serializer.data)
