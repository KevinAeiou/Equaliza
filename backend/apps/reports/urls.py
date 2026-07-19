from django.urls import path

from apps.reports.views import DashboardSummaryView
from apps.reports.views import DashboardChartsView


urlpatterns = [
    path(
        "dashboard/summary/",
        DashboardSummaryView.as_view(),
        name="summary",
    ),
    path(
        "dashboard/charts/",
        DashboardChartsView.as_view(),
        name="charts",
    ),
]
