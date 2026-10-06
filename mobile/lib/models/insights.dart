import 'parsing.dart';

enum InsightTone {
  alert,
  warning,
  neutral,
  good;

  static InsightTone parse(Object? value) => values.firstWhere((tone) => tone.name == value, orElse: () => neutral);
}

enum InsightKind {
  aboveAverage('above_average'),
  belowAverage('below_average'),
  drop('drop'),
  rise('rise'),
  totalChange('total_change'),
  largestExpense('largest_expense'),
  trend('trend'),
  concentration('concentration'),
  savings('savings'),
  projection('projection'),
  weekday('weekday'),
  upcoming('upcoming');

  const InsightKind(this.key);

  final String key;

  static InsightKind parse(Object? value) => values.firstWhere((kind) => kind.key == value, orElse: () => concentration);
}

class InsightBar {
  const InsightBar({required this.label, required this.value, required this.fraction, this.highlighted = false});

  factory InsightBar.fromJson(Map<String, dynamic> json) => InsightBar(
        label: json['label'] as String? ?? '',
        value: json['value'] as String? ?? '',
        fraction: toDouble(json['fraction']),
        highlighted: json['highlighted'] as bool? ?? false,
      );

  final String label;
  final String value;

  /// 0 a 1, em relação à maior barra do card.
  final double fraction;

  /// A barra que representa o período atual ganha a cor do tom do card.
  final bool highlighted;
}

class InsightProgress {
  const InsightProgress({required this.fraction, required this.start, required this.end});

  factory InsightProgress.fromJson(Map<String, dynamic> json) => InsightProgress(
        fraction: toDouble(json['fraction']),
        start: json['start'] as String? ?? '',
        end: json['end'] as String? ?? '',
      );

  final double fraction;
  final String start;
  final String end;
}

class SparkPoint {
  const SparkPoint({required this.label, required this.value, required this.fraction, this.highlighted = false});

  factory SparkPoint.fromJson(Map<String, dynamic> json) => SparkPoint(
        label: json['label'] as String? ?? '',
        value: json['value'] as String? ?? '',
        fraction: toDouble(json['fraction']),
        highlighted: json['highlighted'] as bool? ?? false,
      );

  final String label;
  final String value;
  final double fraction;

  /// O ponto que o card destaca (o período atual ou o dia da semana mais pesado).
  final bool highlighted;
}

List<T> _list<T>(Object? value, T Function(Map<String, dynamic>) parse) =>
    (value as List? ?? []).cast<Map<String, dynamic>>().map(parse).toList();

class Insight {
  const Insight({
    required this.kind,
    required this.tone,
    required this.tag,
    required this.title,
    required this.body,
    this.bars = const [],
    this.progress,
    this.spark = const [],
    this.note,
  });

  factory Insight.fromJson(Map<String, dynamic> json) => Insight(
        kind: InsightKind.parse(json['kind']),
        tone: InsightTone.parse(json['tone']),
        tag: json['tag'] as String? ?? '',
        title: json['title'] as String? ?? '',
        body: json['body'] as String? ?? '',
        bars: _list(json['bars'], InsightBar.fromJson),
        progress: json['progress'] == null ? null : InsightProgress.fromJson(json['progress'] as Map<String, dynamic>),
        spark: _list(json['spark'], SparkPoint.fromJson),
        note: json['note'] as String?,
      );

  final InsightKind kind;
  final InsightTone tone;
  final String tag;
  final String title;
  final String body;
  final List<InsightBar> bars;
  final InsightProgress? progress;
  final List<SparkPoint> spark;
  final String? note;
}

class CategoryComparison {
  const CategoryComparison({required this.name, required this.value, required this.average, this.change});

  factory CategoryComparison.fromJson(Map<String, dynamic> json) => CategoryComparison(
        name: json['name'] as String? ?? '',
        value: toDouble(json['value']),
        average: json['average'] == null ? null : toDouble(json['average']),
        change: json['change'] == null ? null : toDouble(json['change']),
      );

  final String name;
  final double value;

  /// Nulo quando a categoria não tem histórico.
  final double? average;

  /// Variação sobre a média (0,38 = 38% acima); nulo sem média.
  final double? change;
}

class InsightsReport {
  const InsightsReport({
    this.insights = const [],
    this.comparisons = const [],
    this.hasExpenses = false,
    this.hasHistory = false,
    this.hasPrevious = false,
    this.historyPeriods = 0,
    this.averageLabel = '',
    this.aboveCount = 0,
    this.belowCount = 0,
    this.droppedCount = 0,
  });

  factory InsightsReport.fromJson(Map<String, dynamic> json) => InsightsReport(
        insights: _list(json['insights'], Insight.fromJson),
        comparisons: _list(json['comparisons'], CategoryComparison.fromJson),
        hasExpenses: json['has_expenses'] as bool? ?? false,
        hasHistory: json['has_history'] as bool? ?? false,
        hasPrevious: json['has_previous'] as bool? ?? false,
        historyPeriods: (json['history_periods'] as num?)?.toInt() ?? 0,
        averageLabel: json['average_label'] as String? ?? '',
        aboveCount: (json['above_count'] as num?)?.toInt() ?? 0,
        belowCount: (json['below_count'] as num?)?.toInt() ?? 0,
        droppedCount: (json['dropped_count'] as num?)?.toInt() ?? 0,
      );

  final List<Insight> insights;
  final List<CategoryComparison> comparisons;

  /// Há despesas no período filtrado.
  final bool hasExpenses;

  /// Há períodos anteriores suficientes para calcular médias.
  final bool hasHistory;

  /// Há despesas no período imediatamente anterior.
  final bool hasPrevious;

  /// Períodos anteriores com despesas usados na média.
  final int historyPeriods;

  /// Ex.: "dos 6 meses anteriores".
  final String averageLabel;

  final int aboveCount;
  final int belowCount;
  final int droppedCount;
}
