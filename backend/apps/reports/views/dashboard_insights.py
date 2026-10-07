from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsFamilyMember
from apps.reports.serializers import DashboardInsightsSerializer
from apps.reports.serializers.dashboard_insights import DashboardInsightsParamsSerializer
from apps.reports.services import DashboardInsightsService


class DashboardInsightsView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsFamilyMember,
    ]

    @extend_schema(parameters=[DashboardInsightsParamsSerializer], responses=DashboardInsightsSerializer)
    def get(self, request):
        report = DashboardInsightsService.execute(
            request.user,
            request.query_params,
        )

        return Response(DashboardInsightsSerializer(report).data)
