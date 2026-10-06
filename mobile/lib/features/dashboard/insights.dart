import 'dart:math' as math;

import 'package:intl/intl.dart';

import '../../core/utils/formatters.dart';
import '../../core/utils/period.dart';
import '../../models/finance.dart';

/// Quantos períodos anteriores entram na média.
const insightHistory = 6;

/// Períodos anteriores com despesas necessários para falar em "média".
const minHistoryPeriods = 2;

/// Diferenças menores que isso (em reais) são ruído e não geram insight.
const _minDifference = 30.0;

DateTime _day(DateTime date) => DateTime(date.year, date.month, date.day);

bool _within(DateTime date, Period period) => !date.isBefore(period.from) && !date.isAfter(period.to);

/// Intervalo que cobre os períodos usados como referência (do 6º anterior ao imediatamente anterior).
Period insightsWindow(PeriodType type, Period period) => Period(
      shiftPeriod(type, period, -insightHistory).from,
      shiftPeriod(type, period, -1).to,
    );

enum InsightTone { alert, warning, neutral, good }

class InsightBar {
  const InsightBar({required this.label, required this.value, required this.fraction, this.highlighted = false});

  final String label;
  final String value;

  /// 0 a 1, em relação à maior barra do card.
  final double fraction;

  /// A barra que representa o período atual ganha a cor do tom do card.
  final bool highlighted;
}

class InsightProgress {
  const InsightProgress({required this.fraction, required this.start, required this.end});

  final double fraction;
  final String start;
  final String end;
}

class SparkPoint {
  const SparkPoint({required this.label, required this.value, required this.fraction});

  final String label;
  final String value;
  final double fraction;
}

enum InsightKind { aboveAverage, belowAverage, drop, rise, totalChange, largestExpense, trend, concentration }

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
  const CategoryComparison({required this.name, required this.value, required this.average});

  final String name;
  final double value;

  /// Nulo quando a categoria não tem histórico.
  final double? average;

  /// Variação sobre a média (0,38 = 38% acima); nulo sem média.
  double? get change => average == null || average! <= 0 ? null : (value - average!) / average!;
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

class _Unit {
  const _Unit({
    required this.plural,
    required this.of,
    required this.current,
    required this.thisUnit,
    required this.previousTo,
    required this.previousOf,
  });

  final String plural;
  final String of;
  final String current;
  final String thisUnit;
  final String previousTo;
  final String previousOf;
}

const _units = {
  PeriodType.day: _Unit(
    plural: 'dias',
    of: 'dos',
    current: 'Hoje',
    thisUnit: 'neste dia',
    previousTo: 'ao dia anterior',
    previousOf: 'do dia anterior',
  ),
  PeriodType.week: _Unit(
    plural: 'semanas',
    of: 'das',
    current: 'Esta semana',
    thisUnit: 'nesta semana',
    previousTo: 'à semana anterior',
    previousOf: 'da semana anterior',
  ),
  PeriodType.month: _Unit(
    plural: 'meses',
    of: 'dos',
    current: 'Este mês',
    thisUnit: 'neste mês',
    previousTo: 'ao mês anterior',
    previousOf: 'do mês anterior',
  ),
  PeriodType.year: _Unit(
    plural: 'anos',
    of: 'dos',
    current: 'Este ano',
    thisUnit: 'neste ano',
    previousTo: 'ao ano anterior',
    previousOf: 'do ano anterior',
  ),
  PeriodType.range: _Unit(
    plural: 'períodos',
    of: 'dos',
    current: 'Este período',
    thisUnit: 'neste período',
    previousTo: 'ao período anterior',
    previousOf: 'do período anterior',
  ),
};

String _shortLabel(PeriodType type, Period period) => switch (type) {
      PeriodType.month => capitalize(DateFormat('MMM', 'pt_BR').format(period.from).replaceAll('.', '')),
      PeriodType.year => '${period.from.year}',
      _ => DateFormat('dd/MM').format(period.from),
    };

Map<int, double> _sumByCategory(Iterable<FinanceEntry> entries) {
  final sums = <int, double>{};

  for (final entry in entries) {
    sums[entry.category.id] = (sums[entry.category.id] ?? 0) + entry.amount;
  }

  return sums;
}

double _total(Iterable<double> values) => values.fold(0, (sum, value) => sum + value);

int _percent(double ratio) => (ratio * 100).round();

/// Insights sobre as despesas do período, calculados no app a partir dos lançamentos.
///
/// [current] são as despesas do período e [history] as dos [insightHistory] períodos anteriores
/// (veja [insightsWindow]). Cada insight só aparece quando há dados para sustentá-lo.
InsightsReport buildInsights({
  required PeriodType type,
  required Period period,
  required List<FinanceEntry> current,
  required List<FinanceEntry> history,
  DateTime? now,
}) {
  if (current.isEmpty) return const InsightsReport();

  final unit = _units[type]!;
  final today = _day(now ?? DateTime.now());
  final ongoing = !today.isBefore(period.from) && !today.isAfter(period.to);

  final priors = [for (var i = 1; i <= insightHistory; i++) shiftPeriod(type, period, -i)];
  final buckets = [
    for (final prior in priors) history.where((entry) => _within(entry.date, prior)).toList(),
  ];

  final active = buckets.where((bucket) => bucket.isNotEmpty).length;
  final hasHistory = active >= minHistoryPeriods;

  // Em um período em andamento, o anterior é cortado no mesmo ponto para a comparação ser justa.
  var previous = buckets.first;

  if (ongoing) {
    final elapsed = today.difference(period.from).inDays;
    final cutoff = DateTime(priors.first.from.year, priors.first.from.month, priors.first.from.day + elapsed);

    previous = previous.where((entry) => !entry.date.isAfter(cutoff)).toList();
  }

  final hasPrevious = previous.isNotEmpty;

  final names = {
    for (final entry in [...current, ...history]) entry.category.id: entry.category.name,
  };
  final spent = _sumByCategory(current);
  final before = _sumByCategory(previous);
  final total = _total(spent.values);
  final previousTotal = _total(before.values);

  final average = <int, double>{};

  if (hasHistory) {
    for (final entry in _sumByCategory(buckets.expand((bucket) => bucket)).entries) {
      average[entry.key] = entry.value / active;
    }
  }

  final averageLabel = '${unit.of} $active ${unit.plural} anteriores';
  final versus = ongoing ? 'ao mesmo ponto ${unit.previousOf}' : unit.previousTo;
  final insights = <Insight>[];

  // Maior categoria acima da média; sem ela, a categoria que mais se afastou para cima.
  int? aboveId;

  if (hasHistory) {
    double over(int id) => (spent[id]! - average[id]!) / average[id]!;
    final known = spent.keys.where((id) => (average[id] ?? 0) > 0 && spent[id]! - average[id]! >= _minDifference).toList();

    if (known.isNotEmpty) {
      final biggest = spent.keys.reduce((a, b) => spent[a]! >= spent[b]! ? a : b);
      final byValue = known.contains(biggest) && over(biggest) >= 0.10;
      final byRatio = known.where((id) => over(id) >= 0.20).toList()..sort((a, b) => over(b).compareTo(over(a)));

      if (byValue) {
        aboveId = biggest;
      } else if (byRatio.isNotEmpty) {
        aboveId = byRatio.first;
      }
    }

    if (aboveId != null) {
      final id = aboveId;
      final value = spent[id]!;
      final mean = average[id]!;
      final ratio = over(id);
      final share = value / total;
      final peak = math.max(value, mean);

      insights.add(
        Insight(
          kind: InsightKind.aboveAverage,
          tone: ratio >= 0.30 ? InsightTone.alert : InsightTone.warning,
          tag: ratio >= 0.30 ? 'Gasto elevado' : 'Acima da média',
          title: '${names[id]} ${ongoing ? 'está' : 'ficou'} ${_percent(ratio)}% acima da sua média',
          body: '${ongoing ? 'Você já gastou ${formatCurrency(value)} ${unit.thisUnit}' : 'Você gastou ${formatCurrency(value)} no período'}. '
              'A média $averageLabel é ${formatCurrency(mean)} — são ${formatCurrency(value - mean)} a mais.',
          bars: [
            InsightBar(label: unit.current, value: formatCurrency(value), fraction: value / peak, highlighted: true),
            InsightBar(label: 'Média', value: formatCurrency(mean), fraction: mean / peak),
          ],
          note: share >= 0.4 && spent.length > 1 ? '${names[id]} concentra ${_percent(share)}% de todas as despesas.' : null,
        ),
      );
    }
  }

  // Comparações com o período anterior.
  int? changedId;

  if (hasPrevious) {
    final both = spent.keys.where((id) => (before[id] ?? 0) > 0).toList();

    // Maior queda em reais, ao menos 10%.
    final drops = both.where((id) => before[id]! - spent[id]! >= _minDifference && spent[id]! <= before[id]! * 0.9).toList()
      ..sort((a, b) => (before[b]! - spent[b]!).compareTo(before[a]! - spent[a]!));

    // Categorias que também caíram até zerar não aparecem em `spent`.
    final vanished = before.keys.where((id) => !spent.containsKey(id) && before[id]! >= _minDifference).toList()
      ..sort((a, b) => before[b]!.compareTo(before[a]!));

    final rises = both.where((id) => id != aboveId && spent[id]! - before[id]! >= _minDifference * 1.5 && spent[id]! >= before[id]! * 1.25).toList()
      ..sort((a, b) => (spent[b]! / before[b]!).compareTo(spent[a]! / before[a]!));

    if (rises.isNotEmpty) {
      final id = rises.first;
      final value = spent[id]!;
      final old = before[id]!;
      final peak = math.max(value, old);

      changedId = id;
      insights.add(
        Insight(
          kind: InsightKind.rise,
          tone: value >= old * 1.5 ? InsightTone.alert : InsightTone.warning,
          tag: 'Em alta',
          title: '${names[id]} subiu ${_percent((value - old) / old)}% em relação $versus',
          body: 'De ${formatCurrency(old)} para ${formatCurrency(value)}: ${formatCurrency(value - old)} a mais.',
          bars: [
            InsightBar(label: ongoing ? 'Mesmo ponto' : 'Anterior', value: formatCurrency(old), fraction: old / peak),
            InsightBar(label: unit.current, value: formatCurrency(value), fraction: value / peak, highlighted: true),
          ],
        ),
      );
    }

    if (drops.isNotEmpty || vanished.isNotEmpty) {
      final useVanished = drops.isEmpty;
      final id = useVanished ? vanished.first : drops.first;
      final value = spent[id] ?? 0;
      final old = before[id]!;
      final peak = math.max(value, old);

      insights.add(
        Insight(
          kind: InsightKind.drop,
          tone: InsightTone.good,
          tag: 'Em queda',
          title: useVanished
              ? '${names[id]} não teve gastos, contra ${formatCurrency(old)} $versus'
              : '${names[id]} caiu ${_percent((old - value) / old)}% em relação $versus',
          body: useVanished
              ? 'Foram ${formatCurrency(old)} a menos nessa categoria.'
              : 'De ${formatCurrency(old)} para ${formatCurrency(value)}: ${formatCurrency(old - value)} a menos. '
                  'Foi o maior recuo entre as suas categorias.',
          bars: [
            InsightBar(label: ongoing ? 'Mesmo ponto' : 'Anterior', value: formatCurrency(old), fraction: old / peak),
            InsightBar(label: unit.current, value: formatCurrency(value), fraction: value / peak, highlighted: true),
          ],
        ),
      );
    }

    // Total das despesas, só quando a mudança é relevante.
    if (previousTotal > 0 && (total - previousTotal).abs() >= _minDifference) {
      final change = (total - previousTotal) / previousTotal;
      final peak = math.max(total, previousTotal);

      if (change <= -0.05 || change >= 0.10) {
        insights.add(
          Insight(
            kind: InsightKind.totalChange,
            tone: change <= -0.05
                ? InsightTone.good
                : change >= 0.30
                    ? InsightTone.alert
                    : InsightTone.warning,
            tag: change < 0 ? 'Despesas em queda' : 'Despesas em alta',
            title: 'Suas despesas ${change < 0 ? 'caíram' : 'subiram'} ${_percent(change.abs())}% em relação $versus',
            body: 'De ${formatCurrency(previousTotal)} para ${formatCurrency(total)}: '
                '${formatCurrency((total - previousTotal).abs())} ${change < 0 ? 'a menos' : 'a mais'}.',
            bars: [
              InsightBar(label: ongoing ? 'Mesmo ponto' : 'Anterior', value: formatCurrency(previousTotal), fraction: previousTotal / peak),
              InsightBar(label: unit.current, value: formatCurrency(total), fraction: total / peak, highlighted: true),
            ],
          ),
        );
      }
    }
  }

  // Categoria que vem subindo períodos seguidos (precisa dos dois anteriores).
  if (buckets.length >= 3) {
    final p1 = _sumByCategory(buckets[0]);
    final p2 = _sumByCategory(buckets[1]);
    final p3 = _sumByCategory(buckets[2]);

    final rising = spent.keys
        .where((id) => id != aboveId && id != changedId)
        .where((id) => (p2[id] ?? 0) > 0 && (p1[id] ?? 0) > p2[id]! && spent[id]! > p1[id]!)
        .where((id) => spent[id]! - p2[id]! >= _minDifference && spent[id]! >= p2[id]! * 1.10)
        .toList()
      ..sort((a, b) => (spent[b]! / p2[b]!).compareTo(spent[a]! / p2[a]!));

    if (rising.isNotEmpty) {
      final id = rising.first;
      final points = [
        if ((p3[id] ?? 0) > 0) (priors[2], p3[id]!),
        (priors[1], p2[id]!),
        (priors[0], p1[id]!),
        (period, spent[id]!),
      ];
      final peak = points.map((point) => point.$2).reduce(math.max);

      insights.add(
        Insight(
          kind: InsightKind.trend,
          tone: InsightTone.warning,
          tag: 'Tendência de alta',
          title: '${names[id]} vem subindo há 3 ${unit.plural}',
          body: 'Subiu de ${formatCurrency(p2[id]!)} para ${formatCurrency(spent[id]!)} nos últimos 3 ${unit.plural}. '
              'Vale rever esse gasto antes que vire hábito.',
          spark: [
            for (final point in points)
              SparkPoint(label: _shortLabel(type, point.$1), value: formatCurrency(point.$2), fraction: point.$2 / peak),
          ],
        ),
      );
    }
  }

  // Margem até a média (ou quanto ficou abaixo dela).
  if (hasHistory) {
    final below = average.keys
        .where((id) => average[id]! > 0 && (spent[id] ?? 0) <= average[id]! * 0.9 && average[id]! - (spent[id] ?? 0) >= _minDifference)
        .where((id) => spent.containsKey(id))
        .toList()
      ..sort((a, b) => (average[b]! - spent[b]!).compareTo(average[a]! - spent[a]!));

    if (below.isNotEmpty) {
      final id = below.first;
      final value = spent[id]!;
      final mean = average[id]!;
      final gap = mean - value;

      insights.add(
        Insight(
          kind: InsightKind.belowAverage,
          tone: InsightTone.good,
          tag: ongoing ? 'Margem até a média' : 'Abaixo da média',
          title: ongoing
              ? '${names[id]}: faltam ${formatCurrency(gap)} para chegar à média'
              : '${names[id]} ficou ${formatCurrency(gap)} abaixo da média',
          body: 'Você gastou ${formatCurrency(value)} e a média da categoria $averageLabel é ${formatCurrency(mean)}.'
              '${ongoing ? ' Esse é o espaço que ainda há antes de gastar mais do que costuma.' : ''}',
          progress: InsightProgress(
            fraction: (value / mean).clamp(0.0, 1.0),
            start: '${formatCurrency(value)} gastos',
            end: 'Média ${formatCurrency(mean)}',
          ),
        ),
      );
    }
  }

  // Maior lançamento do período.
  if (current.length >= 3) {
    final biggest = current.reduce((a, b) => a.amount >= b.amount ? a : b);
    final share = biggest.amount / total;

    if (share >= 0.25) {
      insights.add(
        Insight(
          kind: InsightKind.largestExpense,
          tone: share >= 0.35 ? InsightTone.warning : InsightTone.neutral,
          tag: 'Maior despesa',
          title: 'Uma única despesa pesa ${_percent(share)}% do período',
          body: '"${biggest.title}", de ${formatCurrency(biggest.amount)}, é o maior lançamento — '
              '${_percent(biggest.amount / spent[biggest.category.id]!)}% de tudo o que você gastou em ${biggest.category.name}.',
          progress: InsightProgress(
            fraction: share.clamp(0.0, 1.0),
            start: formatCurrency(biggest.amount),
            end: 'Total ${formatCurrency(total)}',
          ),
        ),
      );
    }
  }

  // Dependência de uma única categoria, quando o insight de média já não a cobre.
  if (spent.length >= 2) {
    final top = spent.keys.reduce((a, b) => spent[a]! >= spent[b]! ? a : b);
    final share = spent[top]! / total;

    if (share >= 0.5 && top != aboveId) {
      insights.add(
        Insight(
          kind: InsightKind.concentration,
          tone: InsightTone.neutral,
          tag: 'Concentração',
          title: '${names[top]} concentra ${_percent(share)}% das despesas',
          body: '${formatCurrency(spent[top]!)} de ${formatCurrency(total)} no período. '
              'Uma variação nessa categoria muda muito o seu total.',
          progress: InsightProgress(
            fraction: share.clamp(0.0, 1.0),
            start: names[top]!,
            end: 'Total ${formatCurrency(total)}',
          ),
        ),
      );
    }
  }

  const rank = {InsightTone.alert: 0, InsightTone.warning: 1, InsightTone.neutral: 2, InsightTone.good: 3};
  final ordered = [...insights]..sort((a, b) => rank[a.tone]!.compareTo(rank[b.tone]!));

  // Comparação com a média, da maior categoria para a menor.
  final comparisons = hasHistory
      ? ([
          for (final entry in spent.entries)
            CategoryComparison(name: names[entry.key]!, value: entry.value, average: average[entry.key]),
        ]..sort((a, b) => b.value.compareTo(a.value)))
      : <CategoryComparison>[];

  final ids = {...spent.keys, ...average.keys};

  return InsightsReport(
    insights: ordered.take(6).toList(),
    comparisons: comparisons,
    hasExpenses: true,
    hasHistory: hasHistory,
    hasPrevious: hasPrevious,
    historyPeriods: active,
    averageLabel: averageLabel,
    aboveCount: hasHistory ? ids.where((id) => (average[id] ?? 0) > 0 && (spent[id] ?? 0) > average[id]! * 1.05).length : 0,
    belowCount: hasHistory ? ids.where((id) => (average[id] ?? 0) > 0 && (spent[id] ?? 0) < average[id]! * 0.95).length : 0,
    droppedCount: hasPrevious ? ids.where((id) => (before[id] ?? 0) > 0 && (spent[id] ?? 0) < before[id]! * 0.95).length : 0,
  );
}
