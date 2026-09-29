import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/period.dart';
import '../../core/widgets/basics.dart';
import '../../models/dashboard.dart';
import '../../models/finance.dart';
import '../shell/app_section.dart';

const _tabular = [FontFeature.tabularFigures()];

class SummaryCards extends StatelessWidget {
  const SummaryCards({super.key, required this.summary});

  final DashboardSummary? summary;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final data = summary;
    final savings = data?.savingsRate;

    return Column(
      children: [
        AppCard(
          color: colors.brand,
          child: DefaultTextStyle.merge(
            style: const TextStyle(color: Colors.white),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _CardHeading(
                  title: 'Saldo do período',
                  titleColor: Colors.white,
                  icon: LucideIcons.wallet,
                  iconBackground: Colors.white.withValues(alpha: 0.15),
                  iconColor: Colors.white,
                ),
                const SizedBox(height: 12),
                data == null
                    ? Skeleton(height: 32, width: 180, radius: 8)
                    : _Value(formatCurrency(data.balance), size: 28, color: Colors.white),
                const SizedBox(height: 12),
                Text(
                  'Receitas menos despesas',
                  style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.8)),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _SmallSummary(
                title: 'Receitas',
                value: data?.income,
                icon: LucideIcons.arrowUpRight,
                iconBackground: colors.incomeSoft,
                iconColor: colors.income,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _SmallSummary(
                title: 'Despesas',
                value: data?.expense,
                icon: LucideIcons.arrowDownRight,
                iconBackground: colors.expenseSoft,
                iconColor: colors.expenseStrong,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _CardHeading(
                title: 'Poupança',
                icon: LucideIcons.piggyBank,
                iconBackground: colors.incomeSoft,
                iconColor: colors.income,
              ),
              const SizedBox(height: 12),
              data == null
                  ? const Skeleton(height: 32, width: 120)
                  : _Value(savings == null ? '—' : formatPercent(savings), size: 28),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Text('da receita guardada', style: TextStyle(fontSize: 14, color: colors.mutedForeground)),
                  ),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: SizedBox(
                      width: 96,
                      height: 8,
                      child: LinearProgressIndicator(
                        value: (savings ?? 0).clamp(0, 1).toDouble(),
                        backgroundColor: colors.incomeSoft,
                        color: colors.income,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _CardHeading extends StatelessWidget {
  const _CardHeading({
    required this.title,
    required this.icon,
    required this.iconBackground,
    required this.iconColor,
    this.titleColor,
  });

  final String title;
  final IconData icon;
  final Color iconBackground;
  final Color iconColor;
  final Color? titleColor;

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: titleColor ?? context.colors.mutedForeground,
              ),
            ),
          ),
          IconBadge(icon: icon, background: iconBackground, foreground: iconColor, size: 32),
        ],
      );
}

class _Value extends StatelessWidget {
  const _Value(this.text, {this.size = 20, this.color});

  final String text;
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) => FittedBox(
        fit: BoxFit.scaleDown,
        alignment: Alignment.centerLeft,
        child: Text(
          text,
          style: TextStyle(
            fontSize: size,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.4,
            color: color,
            fontFeatures: _tabular,
          ),
        ),
      );
}

class _SmallSummary extends StatelessWidget {
  const _SmallSummary({
    required this.title,
    required this.value,
    required this.icon,
    required this.iconBackground,
    required this.iconColor,
  });

  final String title;
  final double? value;
  final IconData icon;
  final Color iconBackground;
  final Color iconColor;

  @override
  Widget build(BuildContext context) => AppCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _CardHeading(title: title, icon: icon, iconBackground: iconBackground, iconColor: iconColor),
            const SizedBox(height: 12),
            value == null ? const Skeleton(height: 28) : _Value(formatCurrency(value!)),
          ],
        ),
      );
}

/// Comparativo dos últimos 6 meses; o mês mais recente fica em destaque.
class IncomeExpenseChart extends StatelessWidget {
  const IncomeExpenseChart({super.key, required this.trend});

  final List<TrendPoint>? trend;

  static const _height = 200.0;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final points = trend;
    final maxValue = points == null || points.isEmpty
        ? 0.0
        : points.map((point) => math.max(point.income, point.expense)).reduce(math.max);
    final step = _niceStep(maxValue / 4);
    final top = step * 4;

    Widget legend(String label, Color color) => Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3)),
            ),
            const SizedBox(width: 6),
            Text(label, style: const TextStyle(fontSize: 12)),
          ],
        );

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const CardTitle(
            title: 'Receitas x Despesas',
            description: 'Comparativo dos últimos 6 meses. O mês mais recente fica em destaque.',
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              legend('Receitas', colors.income),
              const SizedBox(width: 16),
              legend('Despesas', colors.expense),
            ],
          ),
          const SizedBox(height: 16),
          if (points == null)
            const Skeleton(height: _height + 24)
          else
            Semantics(
              label: 'Gráfico de receitas e despesas dos últimos 6 meses',
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 44,
                    height: _height,
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        for (var index = 0; index <= 4; index++)
                          Positioned(
                            right: 0,
                            top: _height * index / 4 - 8,
                            child: Text(
                              formatCompact(top - step * index),
                              style: TextStyle(fontSize: 11, color: colors.mutedForeground),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      children: [
                        SizedBox(
                          height: _height,
                          child: Stack(
                            children: [
                              for (var index = 0; index <= 4; index++)
                                Positioned(
                                  left: 0,
                                  right: 0,
                                  top: math.min(_height * index / 4, _height - 1),
                                  child: Container(height: 1, color: colors.border),
                                ),
                              Positioned.fill(
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                                  children: [
                                    for (final (index, point) in points.indexed)
                                      Opacity(
                                        opacity: index == points.length - 1 ? 1 : 0.45,
                                        child: Row(
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            _Bar(value: point.income, top: top, color: colors.income),
                                            const SizedBox(width: 4),
                                            _Bar(value: point.expense, top: top, color: colors.expense),
                                          ],
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            for (final (index, point) in points.indexed)
                              SizedBox(
                                width: 32,
                                child: Text(
                                  point.label,
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: index == points.length - 1 ? colors.foreground : colors.mutedForeground,
                                    fontWeight: index == points.length - 1 ? FontWeight.w500 : null,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  /// Arredonda o passo do eixo para um múltiplo "redondo" de uma potência de 10.
  static double _niceStep(double raw) {
    if (raw <= 0) return 250;

    final magnitude = math.pow(10, (math.log(raw) / math.ln10).floor()).toDouble();

    for (final factor in [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]) {
      if (raw <= factor * magnitude) return factor * magnitude;
    }

    return 10 * magnitude;
  }
}

class _Bar extends StatelessWidget {
  const _Bar({required this.value, required this.top, required this.color});

  final double value;
  final double top;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        width: 14,
        height: top == 0 ? 0 : IncomeExpenseChart._height * value / top,
        decoration: BoxDecoration(color: color, borderRadius: const BorderRadius.vertical(top: Radius.circular(4))),
      );
}

class CategoryBreakdown extends StatefulWidget {
  const CategoryBreakdown({super.key, required this.data});

  final List<CategoryTotal>? data;

  @override
  State<CategoryBreakdown> createState() => _CategoryBreakdownState();
}

class _CategoryBreakdownState extends State<CategoryBreakdown> {
  static const _collapsed = 5;

  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final items = widget.data;
    final total = items?.fold<double>(0, (sum, item) => sum + item.value) ?? 0;
    final max = items == null || items.isEmpty ? 0.0 : items.map((item) => item.value).reduce(math.max);
    final visible = items == null ? <CategoryTotal>[] : (_expanded ? items : items.take(_collapsed).toList());

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          CardTitle(
            title: 'Despesas por categoria',
            description: items == null
                ? 'Carregando...'
                : items.isEmpty
                    ? 'Nenhuma despesa no período'
                    : 'Total de ${formatCurrency(total)} no período',
          ),
          for (final item in visible) ...[
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Expanded(
                  child: Text(item.category, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14)),
                ),
                const SizedBox(width: 12),
                Text.rich(
                  TextSpan(
                    text: formatCurrency(item.value),
                    style: const TextStyle(fontWeight: FontWeight.w500),
                    children: [
                      TextSpan(
                        text: ' · ${total == 0 ? 0 : (item.value / total * 100).round()}%',
                        style: TextStyle(fontWeight: FontWeight.w400, color: colors.mutedForeground),
                      ),
                    ],
                  ),
                  style: const TextStyle(fontSize: 14, fontFeatures: _tabular),
                ),
              ],
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                minHeight: 8,
                value: max == 0 ? 0 : item.value / max,
                backgroundColor: colors.muted,
                color: colors.expense,
              ),
            ),
          ],
          if ((items?.length ?? 0) > _collapsed)
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton(
                style: TextButton.styleFrom(padding: EdgeInsets.zero),
                onPressed: () => setState(() => _expanded = !_expanded),
                child: Text(_expanded ? 'Mostrar menos' : 'Ver as ${items!.length} categorias'),
              ),
            ),
        ],
      ),
    );
  }
}

/// Quanto cada um pagou em relação à cota proporcional à sua receita.
class MemberBalance extends StatelessWidget {
  const MemberBalance({super.key, required this.data});

  final List<MemberContribution>? data;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final members = data ?? [];
    final totalExpected = members.fold<double>(0, (sum, item) => sum + item.expected);
    final scale = members.isEmpty
        ? 0.0
        : members.expand((item) => [item.expected, item.paid]).reduce(math.max) * 1.08;
    final settlements = buildSettlements(members);

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const CardTitle(
            title: 'Divisão entre membros',
            description: 'Quanto cada um pagou em relação à sua cota, que é proporcional à receita de cada membro.',
          ),
          const SizedBox(height: 16),
          if (data == null) const Skeleton(height: 80),
          if (data != null && members.isEmpty)
            Text(
              'Nenhum membro com movimentações no período.',
              style: TextStyle(fontSize: 14, color: colors.mutedForeground),
            ),
          for (final (index, item) in members.indexed) ...[
            if (index > 0) const RowDivider(),
            Padding(
              padding: EdgeInsets.only(top: index == 0 ? 0 : 16, bottom: 16),
              child: _MemberRow(
                item: item,
                share: totalExpected == 0 ? 0 : (item.expected / totalExpected * 100).round(),
                scale: scale,
              ),
            ),
          ],
          if (settlements.isNotEmpty)
            Container(
              margin: const EdgeInsets.only(top: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(color: colors.muted, borderRadius: BorderRadius.circular(10)),
              child: Wrap(
                spacing: 16,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  const Text('Para equilibrar', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  for (final item in settlements)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(getFirstName(item.from), style: const TextStyle(fontSize: 14)),
                        const SizedBox(width: 6),
                        Icon(
                          LucideIcons.arrowRight,
                          size: 14,
                          color: colors.mutedForeground,
                          semanticLabel: 'transfere para',
                        ),
                        const SizedBox(width: 6),
                        Text(getFirstName(item.to), style: const TextStyle(fontSize: 14)),
                        const SizedBox(width: 6),
                        Text(
                          formatCurrency(item.amount),
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, fontFeatures: _tabular),
                        ),
                      ],
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _MemberRow extends StatelessWidget {
  const _MemberRow({required this.item, required this.share, required this.scale});

  final MemberContribution item;
  final int share;
  final double scale;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final above = item.difference >= 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Container(
              width: 36,
              height: 36,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: colors.muted, shape: BoxShape.circle),
              child: Text(getInitials(item.member), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.member, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                  Text('Cota de $share%', style: TextStyle(fontSize: 12, color: colors.mutedForeground)),
                ],
              ),
            ),
            Pill(
              label: formatSignedCurrency(item.difference),
              background: above ? colors.incomeSoft : colors.expenseSoft,
              foreground: above ? colors.income : colors.expenseStrong,
            ),
          ],
        ),
        const SizedBox(height: 10),
        LayoutBuilder(
          builder: (context, constraints) {
            final width = constraints.maxWidth;
            double position(double value) => scale == 0 ? 0 : (value / scale).clamp(0, 1) * width;

            return SizedBox(
              height: 18,
              child: Stack(
                children: [
                  Positioned(
                    left: 0,
                    right: 0,
                    top: 4,
                    child: Container(
                      height: 10,
                      decoration: BoxDecoration(color: colors.muted, borderRadius: BorderRadius.circular(999)),
                    ),
                  ),
                  Positioned(
                    left: 0,
                    top: 4,
                    child: Container(
                      width: position(item.paid),
                      height: 10,
                      decoration: BoxDecoration(
                        color: above ? colors.income : colors.expense,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  Positioned(
                    left: math.max(0, position(item.expected) - 1),
                    top: 0,
                    child: Tooltip(
                      message: 'Cota esperada',
                      child: Container(
                        width: 2,
                        height: 18,
                        decoration: BoxDecoration(color: colors.foreground, borderRadius: BorderRadius.circular(999)),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        const SizedBox(height: 8),
        Text.rich(
          TextSpan(
            text: 'Pagou ',
            children: [
              TextSpan(
                text: formatCurrency(item.paid),
                style: TextStyle(fontWeight: FontWeight.w500, color: colors.foreground),
              ),
              TextSpan(text: ' de ${formatCurrency(item.expected)}'),
            ],
          ),
          style: TextStyle(fontSize: 12, color: colors.mutedForeground, fontFeatures: _tabular),
        ),
      ],
    );
  }
}

class RecentTransactions extends StatelessWidget {
  const RecentTransactions({super.key, required this.entries});

  final List<FinanceEntry>? entries;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final items = entries;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          CardTitle(
            title: 'Últimas movimentações',
            description: 'Da família, mais recentes primeiro',
            trailing: TextButton(
              style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 4)),
              onPressed: () => ShellScope.of(context).navigate(AppSection.finance),
              child: const Text('Ver todas'),
            ),
          ),
          const SizedBox(height: 12),
          if (items == null) const Skeleton(height: 120),
          if (items != null && items.isEmpty)
            Text('Nenhuma movimentação no período.', style: TextStyle(fontSize: 14, color: colors.mutedForeground)),
          for (final (index, entry) in (items ?? const <FinanceEntry>[]).indexed) ...[
            if (index > 0) const RowDivider(),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Row(
                children: [
                  EntryIcon(type: entry.type),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          entry.title,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                        ),
                        Text(
                          [
                            entry.category.name,
                            formatDayMonth(entry.date),
                            if (entry.createdBy != null) getFirstName(entry.createdBy!.name),
                          ].join(' · '),
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 12, color: colors.mutedForeground),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${entry.type == EntryType.income ? '+' : '−'}${formatCurrency(entry.amount)}',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      fontFeatures: _tabular,
                      color: entry.type == EntryType.income ? colors.income : null,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
