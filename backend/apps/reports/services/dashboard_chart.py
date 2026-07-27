from apps.reports.managers import DashboardManager


class DashboardChartsService:

    @staticmethod
    def execute(user, filters):
        if not user.current_family:
            return {
                "income_vs_expense": [],
                "expenses_by_category": [],
                "member_contributions": [],
            }

        return DashboardManager.get_charts(user.current_family, filters)
