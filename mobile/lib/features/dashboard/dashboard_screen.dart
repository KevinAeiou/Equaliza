import 'package:flutter/material.dart';

import '../../core/network/api_exception.dart';
import '../../core/utils/period.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/error_view.dart';
import '../../core/widgets/overlays.dart';
import '../../core/widgets/period_filters.dart';
import '../../models/dashboard.dart';
import '../../models/finance.dart';
import '../../models/insights.dart';
import '../category/category_service.dart';
import '../finance/finance_service.dart';
import '../settlement/settlement_months.dart';
import 'dashboard_service.dart';
import 'dashboard_widgets.dart';
import 'insights_widgets.dart';

class DashboardData {
  const DashboardData({
    required this.summary,
    required this.charts,
    required this.trend,
    required this.recent,
  });

  final DashboardSummary summary;
  final DashboardCharts charts;
  final List<TrendPoint> trend;
  final List<FinanceEntry> recent;
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  PeriodFilters _filters = PeriodFilters.initial();
  List<Category> _categories = [];
  DashboardData? _data;
  InsightsReport? _insights;
  ApiException? _error;
  ApiException? _insightsError;
  int _request = 0;
  int _insightsRequest = 0;

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _load();
    _loadInsights();
  }

  Future<void> _loadCategories() async {
    try {
      final categories = await CategoryService.list();
      if (mounted) setState(() => _categories = categories);
    } catch (_) {
      // Sem categorias, os filtros mostram a lista vazia.
    }
  }

  Future<void> _load() async {
    final request = ++_request;
    final filters = _filters;

    setState(() => _error = null);

    try {
      final trendFilters = filters.copyWith(period: trendPeriod(filters.period));

      final results = await Future.wait([
        DashboardService.summary(filters),
        DashboardService.charts(filters),
        DashboardService.charts(trendFilters),
        FinanceService.list(EntryType.income, filters),
        FinanceService.list(EntryType.expense, filters),
      ]);

      final recent = [...results[3] as List<FinanceEntry>, ...results[4] as List<FinanceEntry>]
        ..sort((a, b) {
          final byDate = b.date.compareTo(a.date);
          if (byDate != 0) return byDate;
          return (b.createdAt ?? b.date).compareTo(a.createdAt ?? a.date);
        });

      if (!mounted || request != _request) return;

      setState(() {
        _data = DashboardData(
          summary: results[0] as DashboardSummary,
          charts: results[1] as DashboardCharts,
          trend: buildTrend(filters.period, (results[2] as DashboardCharts).incomeVsExpense),
          recent: recent.take(5).toList(),
        );
      });
    } on ApiException catch (error) {
      if (mounted && request == _request) setState(() => _error = error);
    }
  }

  /// Os insights são calculados no servidor e não bloqueiam o restante do dashboard.
  Future<void> _loadInsights() async {
    final request = ++_insightsRequest;
    final filters = _filters;

    setState(() {
      _insights = null;
      _insightsError = null;
    });

    try {
      final report = await DashboardService.insights(filters);

      if (!mounted || request != _insightsRequest) return;

      setState(() => _insights = report);
    } on ApiException catch (error) {
      if (mounted && request == _insightsRequest) setState(() => _insightsError = error);
    }
  }

  Future<void> _refresh() => Future.wait([_load(), _loadInsights()]);

  void _apply(PeriodFilters filters) {
    setState(() {
      _filters = filters;
      _data = null;
    });
    _load();
    _loadInsights();
  }

  Future<void> _openFilters() async {
    final result = await pushPanel<PeriodFilters>(
      context,
      (_) => PeriodFilterPanel(
        title: 'Filtros do dashboard',
        description: 'Escolha o período e as categorias que entram nos indicadores.',
        initial: _filters,
        groups: [
          CategoryGroup(
            EntryType.expense.plural,
            _categories.where((category) => category.type == EntryType.expense).toList(),
          ),
          CategoryGroup(
            EntryType.income.plural,
            _categories.where((category) => category.type == EntryType.income).toList(),
          ),
        ],
      ),
    );

    if (result != null) _apply(result);
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null && _data == null) {
      return ErrorView.failure(onRetry: _load, note: _error!.message);
    }

    final names = {for (final category in _categories) category.id: category.name};
    final data = _data;

    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
        children: [
          const ScreenHeader(title: 'Dashboard', subtitle: 'Acompanhe o resumo financeiro da sua família.'),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: PeriodNavigator(filters: _filters, onChanged: _apply)),
              const SizedBox(width: 8),
              FilterIconButton(activeCount: _filters.categories.length, onPressed: _openFilters),
            ],
          ),
          if (_filters.categories.isNotEmpty) ...[
            const SizedBox(height: 16),
            ActiveFilterChips(
              filters: [
                for (final id in _filters.categories)
                  ActiveFilter(
                    names[id] ?? 'Categoria',
                    () => _apply(_filters.copyWith(categories: [..._filters.categories]..remove(id))),
                  ),
              ],
              onClear: () => _apply(_filters.copyWith(categories: [])),
            ),
          ],
          const SizedBox(height: 16),
          SummaryCards(summary: data?.summary),
          const SizedBox(height: 16),
          InsightsSection(report: _insights, error: _insightsError, onRetry: _loadInsights),
          const SizedBox(height: 16),
          if (_insights != null && _insights!.hasHistory && _insights!.comparisons.isNotEmpty)
            CategoryVsAverage(report: _insights!)
          else
            CategoryBreakdown(data: data?.charts.expensesByCategory),
          const SizedBox(height: 16),
          MemberBalance(
            data: data?.charts.memberContributions,
            month: monthKey(_filters.period.from),
          ),
          const SizedBox(height: 16),
          IncomeExpenseChart(trend: data?.trend),
          const SizedBox(height: 16),
          RecentTransactions(entries: data?.recent),
        ],
      ),
    );
  }
}
