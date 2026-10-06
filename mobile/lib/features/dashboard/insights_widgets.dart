import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/basics.dart';
import 'insights.dart';

const _tabular = [FontFeature.tabularFigures()];

typedef _Palette = ({Color soft, Color strong, Color bar});

_Palette _palette(AppColors colors, InsightTone tone) => switch (tone) {
      InsightTone.alert => (soft: colors.destructiveSoft, strong: colors.destructive, bar: colors.destructive),
      InsightTone.warning => (soft: colors.expenseSoft, strong: colors.expenseStrong, bar: colors.expense),
      InsightTone.good => (soft: colors.incomeSoft, strong: colors.income, bar: colors.income),
      InsightTone.neutral => (soft: colors.muted, strong: colors.mutedForeground, bar: colors.mutedForeground),
    };

IconData _icon(Insight insight) => switch (insight.kind) {
      InsightKind.aboveAverage => LucideIcons.triangleAlert,
      InsightKind.belowAverage => LucideIcons.target,
      InsightKind.drop => LucideIcons.trendingDown,
      InsightKind.rise || InsightKind.trend => LucideIcons.trendingUp,
      InsightKind.totalChange => insight.tone == InsightTone.good ? LucideIcons.trendingDown : LucideIcons.trendingUp,
      InsightKind.largestExpense => LucideIcons.receipt,
      InsightKind.concentration => LucideIcons.chartPie,
    };

/// Cabeçalho, resumo e cards de insights sobre as despesas do período.
class InsightsSection extends StatelessWidget {
  const InsightsSection({super.key, required this.report, required this.error, required this.onRetry});

  /// Nulo enquanto carrega.
  final InsightsReport? report;
  final ApiException? error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final data = report;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('Insights', style: TextStyle(fontSize: 18, height: 1.33, fontWeight: FontWeight.w600)),
        const SizedBox(height: 2),
        Text(
          'O que mudou nos seus gastos e onde vale prestar atenção.',
          style: TextStyle(fontSize: 14, height: 1.43, color: colors.mutedForeground),
        ),
        const SizedBox(height: 14),
        if (error != null && data == null)
          EmptyCard(
            title: 'Não foi possível carregar os insights',
            description: error!.message,
            action: TextButton(onPressed: onRetry, child: const Text('Tentar novamente')),
          )
        else if (data == null) ...[
          const _InsightSkeleton(),
          const SizedBox(height: 14),
          const _InsightSkeleton(),
        ] else if (!data.hasExpenses)
          const EmptyCard(
            title: 'Sem despesas no período',
            description: 'Registre despesas ou escolha outro período para ver insights sobre os seus gastos.',
          )
        else
          ..._content(context, data),
      ],
    );
  }

  List<Widget> _content(BuildContext context, InsightsReport data) {
    final stats = [
      if (data.hasHistory) ...[
        _Stat(data.aboveCount, data.aboveCount == 1 ? 'categoria acima da média' : 'categorias acima da média', InsightTone.warning),
        _Stat(data.belowCount, data.belowCount == 1 ? 'categoria abaixo da média' : 'categorias abaixo da média', InsightTone.good),
      ],
      if (data.hasPrevious)
        _Stat(data.droppedCount, data.droppedCount == 1 ? 'categoria em queda' : 'categorias em queda', InsightTone.neutral),
    ];

    return [
      if (stats.isNotEmpty) ...[
        Row(
          children: [
            for (var i = 0; i < stats.length; i++) ...[
              if (i > 0) const SizedBox(width: 10),
              Expanded(child: _StatCard(stat: stats[i])),
            ],
          ],
        ),
        const SizedBox(height: 14),
      ],
      if (!data.hasHistory) ...[
        _HistoryNotice(periods: data.historyPeriods),
        const SizedBox(height: 14),
      ],
      if (data.insights.isEmpty && data.hasHistory)
        const _AllClear()
      else
        for (var i = 0; i < data.insights.length; i++) ...[
          if (i > 0) const SizedBox(height: 14),
          _InsightCard(insight: data.insights[i]),
        ],
    ];
  }
}

class _Stat {
  const _Stat(this.count, this.label, this.tone);

  final int count;
  final String label;
  final InsightTone tone;
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.stat});

  final _Stat stat;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final color = stat.tone == InsightTone.neutral ? colors.foreground : _palette(colors, stat.tone).strong;

    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${stat.count}',
            style: TextStyle(fontSize: 26, height: 1.15, fontWeight: FontWeight.w600, color: color, fontFeatures: _tabular),
          ),
          const SizedBox(height: 4),
          Text(stat.label, style: TextStyle(fontSize: 12, height: 1.35, color: colors.mutedForeground)),
        ],
      ),
    );
  }
}

class _HistoryNotice extends StatelessWidget {
  const _HistoryNotice({required this.periods});

  final int periods;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final found = switch (periods) {
      0 => 'Ainda não há despesas em períodos anteriores.',
      1 => 'Encontramos despesas em apenas 1 período anterior.',
      _ => 'Encontramos despesas em $periods períodos anteriores.',
    };

    return AppCard(
      padding: const EdgeInsets.all(16),
      color: colors.muted,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(LucideIcons.info, size: 18, color: colors.mutedForeground),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Histórico insuficiente', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(
                  '$found Para comparar com a média, são necessárias despesas em pelo menos $minHistoryPeriods períodos anteriores. '
                  'Conforme você registra mais gastos, novos insights aparecem aqui.',
                  style: TextStyle(fontSize: 13, height: 1.45, color: colors.mutedForeground),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AllClear extends StatelessWidget {
  const _AllClear();

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return AppCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconBadge(icon: LucideIcons.circleCheck, background: colors.incomeSoft, foreground: colors.income),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Tudo dentro do esperado', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(
                  'Nenhuma categoria se afastou da sua média e não há mudanças relevantes em relação ao período anterior.',
                  style: TextStyle(fontSize: 14, height: 1.43, color: colors.mutedForeground),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InsightSkeleton extends StatelessWidget {
  const _InsightSkeleton();

  @override
  Widget build(BuildContext context) => const AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Skeleton(height: 20, width: 140),
            SizedBox(height: 14),
            Skeleton(height: 24),
            SizedBox(height: 8),
            Skeleton(height: 16, width: 220),
            SizedBox(height: 16),
            Skeleton(height: 10),
          ],
        ),
      );
}

class _InsightCard extends StatelessWidget {
  const _InsightCard({required this.insight});

  final Insight insight;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final palette = _palette(colors, insight.tone);

    return AppCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconBadge(icon: _icon(insight), background: palette.soft, foreground: palette.strong),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  insight.tag.toUpperCase(),
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.5, color: palette.strong),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(insight.title, style: const TextStyle(fontSize: 18, height: 1.3, fontWeight: FontWeight.w600, letterSpacing: -0.2)),
          const SizedBox(height: 8),
          Text(insight.body, style: TextStyle(fontSize: 14, height: 1.45, color: colors.mutedForeground)),
          if (insight.bars.isNotEmpty) ...[
            const SizedBox(height: 16),
            for (var i = 0; i < insight.bars.length; i++) ...[
              if (i > 0) const SizedBox(height: 10),
              _BarRow(bar: insight.bars[i], color: insight.bars[i].highlighted ? palette.bar : colors.mutedForeground),
            ],
          ],
          if (insight.progress != null) ...[
            const SizedBox(height: 16),
            _ProgressRow(progress: insight.progress!, color: palette.bar),
          ],
          if (insight.spark.isNotEmpty) ...[
            const SizedBox(height: 16),
            _Spark(points: insight.spark, color: palette.bar),
          ],
          if (insight.note != null) ...[
            const SizedBox(height: 14),
            const RowDivider(),
            const SizedBox(height: 12),
            Text(insight.note!, style: TextStyle(fontSize: 13, height: 1.4, color: colors.mutedForeground)),
          ],
        ],
      ),
    );
  }
}

class _Track extends StatelessWidget {
  const _Track({required this.fraction, required this.color});

  final double fraction;
  final Color color;

  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(999),
        child: LinearProgressIndicator(
          minHeight: 10,
          value: fraction.isNaN ? 0 : fraction.clamp(0.0, 1.0),
          backgroundColor: context.colors.muted,
          color: color,
        ),
      );
}

class _BarRow extends StatelessWidget {
  const _BarRow({required this.bar, required this.color});

  final InsightBar bar;
  final Color color;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(bar.label, style: TextStyle(fontSize: 13, color: context.colors.mutedForeground)),
              Text(bar.value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, fontFeatures: _tabular)),
            ],
          ),
          const SizedBox(height: 6),
          _Track(fraction: bar.fraction, color: color),
        ],
      );
}

class _ProgressRow extends StatelessWidget {
  const _ProgressRow({required this.progress, required this.color});

  final InsightProgress progress;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final style = TextStyle(fontSize: 13, color: context.colors.mutedForeground, fontFeatures: _tabular);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _Track(fraction: progress.fraction, color: color),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Flexible(child: Text(progress.start, style: style, overflow: TextOverflow.ellipsis)),
            const SizedBox(width: 12),
            Flexible(child: Text(progress.end, style: style, overflow: TextOverflow.ellipsis)),
          ],
        ),
      ],
    );
  }
}

class _Spark extends StatelessWidget {
  const _Spark({required this.points, required this.color});

  final List<SparkPoint> points;
  final Color color;

  static const _height = 64.0;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        for (var i = 0; i < points.length; i++) ...[
          if (i > 0) const SizedBox(width: 12),
          Expanded(
            child: Column(
              children: [
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    points[i].value,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      fontFeatures: _tabular,
                      color: i == points.length - 1 ? color : colors.mutedForeground,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  height: math.max(points[i].fraction * _height, 4),
                  decoration: BoxDecoration(
                    color: i == points.length - 1 ? color : colors.muted,
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                const SizedBox(height: 6),
                Text(points[i].label, style: TextStyle(fontSize: 12, color: colors.mutedForeground)),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

/// Cada categoria da despesa com uma marca na média dos períodos anteriores.
class CategoryVsAverage extends StatefulWidget {
  const CategoryVsAverage({super.key, required this.report});

  final InsightsReport report;

  @override
  State<CategoryVsAverage> createState() => _CategoryVsAverageState();
}

class _CategoryVsAverageState extends State<CategoryVsAverage> {
  static const _collapsed = 5;

  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final items = widget.report.comparisons;
    final visible = _expanded ? items : items.take(_collapsed).toList();
    final scale = items.fold<double>(0, (peak, item) => math.max(peak, math.max(item.value, item.average ?? 0)));

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          CardTitle(
            title: 'Categorias frente à média',
            description: 'A marca vertical é a média ${widget.report.averageLabel}.',
          ),
          for (final item in visible) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: Text(item.name, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14))),
                const SizedBox(width: 12),
                Text(
                  formatCurrency(item.value),
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, fontFeatures: _tabular),
                ),
                const SizedBox(width: 8),
                _ChangeChip(change: item.change),
              ],
            ),
            const SizedBox(height: 8),
            _MarkedBar(
              value: scale == 0 ? 0 : item.value / scale,
              marker: item.average == null || scale == 0 ? null : item.average! / scale,
              color: _barColor(colors, item.change),
            ),
            const SizedBox(height: 4),
            Text(
              item.average == null ? 'Sem histórico nesta categoria' : 'Média ${formatCurrency(item.average!)}',
              style: TextStyle(fontSize: 12, color: colors.mutedForeground),
            ),
          ],
          if (items.length > _collapsed)
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton(
                style: TextButton.styleFrom(padding: EdgeInsets.zero),
                onPressed: () => setState(() => _expanded = !_expanded),
                child: Text(_expanded ? 'Mostrar menos' : 'Ver as ${items.length} categorias'),
              ),
            ),
        ],
      ),
    );
  }
}

Color _barColor(AppColors colors, double? change) {
  if (change == null || change.abs() < 0.05) return colors.mutedForeground;
  if (change < 0) return colors.income;

  return change >= 0.30 ? colors.destructive : colors.expense;
}

class _ChangeChip extends StatelessWidget {
  const _ChangeChip({required this.change});

  final double? change;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final value = change;

    final (label, background, foreground) = switch (value) {
      null => ('sem média', colors.muted, colors.mutedForeground),
      _ when value.abs() < 0.05 => ('na média', colors.muted, colors.mutedForeground),
      _ when value < 0 => ('↓ ${(-value * 100).round()}%', colors.incomeSoft, colors.income),
      _ when value >= 0.30 => ('↑ ${(value * 100).round()}%', colors.destructiveSoft, colors.destructive),
      _ => ('↑ ${(value * 100).round()}%', colors.expenseSoft, colors.expenseStrong),
    };

    return Pill(label: label, background: background, foreground: foreground);
  }
}

/// Barra de progresso com uma marca vertical na posição da média.
class _MarkedBar extends StatelessWidget {
  const _MarkedBar({required this.value, required this.marker, required this.color});

  final double value;
  final double? marker;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return LayoutBuilder(
      builder: (context, constraints) => SizedBox(
        height: 18,
        child: Stack(
          alignment: Alignment.centerLeft,
          clipBehavior: Clip.none,
          children: [
            _Track(fraction: value, color: color),
            if (marker != null)
              Positioned(
                left: (constraints.maxWidth * marker!.clamp(0.0, 1.0)) - 1,
                child: Container(
                  width: 2,
                  height: 18,
                  decoration: BoxDecoration(color: colors.foreground, borderRadius: BorderRadius.circular(1)),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
