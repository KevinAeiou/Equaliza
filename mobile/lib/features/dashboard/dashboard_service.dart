import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/utils/period.dart';
import '../../models/dashboard.dart';

abstract final class DashboardService {
  static Future<DashboardSummary> summary(PeriodFilters filters) =>
      guard('buscar resumo do dashboard', () async {
        final response = await api.get('reports/dashboard/summary/', queryParameters: filters.toQuery());

        return DashboardSummary.fromJson(response.data as Map<String, dynamic>);
      });

  static Future<DashboardCharts> charts(PeriodFilters filters) =>
      guard('buscar gráficos do dashboard', () async {
        final response = await api.get('reports/dashboard/charts/', queryParameters: filters.toQuery());

        return DashboardCharts.fromJson(response.data as Map<String, dynamic>);
      });
}
