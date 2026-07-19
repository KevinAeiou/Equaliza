from apps.reports.managers import DashboardManager


class DashboardChartsService:

    @staticmethod
    def execute(user, filters):
        return DashboardManager.get_charts(user.current_family, filters)
