from ..managers import DashboardManager


class DashboardSummaryService:
    @staticmethod
    def execute(user, filters):
        return DashboardManager.get_summary(
            user.current_family,
            filters=filters,
        )
