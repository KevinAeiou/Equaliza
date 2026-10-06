import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'package:equaliza/core/utils/period.dart';
import 'package:equaliza/features/dashboard/insights.dart';
import 'package:equaliza/models/finance.dart';

int _id = 0;

FinanceEntry _expense(String category, double amount, DateTime date) => FinanceEntry(
      id: ++_id,
      type: EntryType.expense,
      amount: amount,
      date: date,
      category: Category(id: category.hashCode, name: category, type: EntryType.expense),
    );

InsightsReport _build(List<FinanceEntry> current, List<FinanceEntry> history, {DateTime? now}) => buildInsights(
      type: PeriodType.month,
      period: periodFor(PeriodType.month, DateTime(2026, 10, 15)),
      current: current,
      history: history,
      now: now ?? DateTime(2026, 11, 20),
    );

/// Uma despesa por mês nos 6 meses anteriores a outubro de 2026.
List<FinanceEntry> _history(Map<String, double> perMonth, {int months = 6}) => [
      for (var i = 1; i <= months; i++)
        for (final entry in perMonth.entries) _expense(entry.key, entry.value, DateTime(2026, 10 - i, 10)),
    ];

void main() {
  setUpAll(() => initializeDateFormatting('pt_BR'));

  test('sem despesas no período não há insights', () {
    final report = _build([], _history({'Moradia': 2000}));

    expect(report.hasExpenses, isFalse);
    expect(report.insights, isEmpty);
  });

  test('sem histórico só usa o que o período sustenta', () {
    final report = _build([
      _expense('Moradia', 1800, DateTime(2026, 10, 5)),
      _expense('Mercado', 300, DateTime(2026, 10, 6)),
      _expense('Lazer', 100, DateTime(2026, 10, 7)),
    ], []);

    expect(report.hasExpenses, isTrue);
    expect(report.hasHistory, isFalse);
    expect(report.hasPrevious, isFalse);
    expect(report.comparisons, isEmpty);
    expect(report.insights.map((i) => i.kind), everyElement(isIn([InsightKind.largestExpense, InsightKind.concentration])));
  });

  test('um único período anterior não basta para a média', () {
    final report = _build(
      [_expense('Moradia', 2760, DateTime(2026, 10, 5))],
      _history({'Moradia': 2000}, months: 1),
    );

    expect(report.hasHistory, isFalse);
    expect(report.historyPeriods, 1);
    expect(report.insights.where((i) => i.kind == InsightKind.aboveAverage), isEmpty);
  });

  test('maior categoria acima da média', () {
    final report = _build(
      [_expense('Moradia', 2760, DateTime(2026, 10, 5)), _expense('Lazer', 300, DateTime(2026, 10, 8))],
      _history({'Moradia': 2000, 'Lazer': 300}),
    );

    final insight = report.insights.firstWhere((i) => i.kind == InsightKind.aboveAverage);

    expect(insight.title, 'Moradia ficou 38% acima da sua média');
    expect(insight.tone, InsightTone.alert);
    expect(report.aboveCount, 1);
  });

  test('margem até a média em período em andamento', () {
    final report = _build(
      [_expense('Lazer', 120, DateTime(2026, 10, 3))],
      _history({'Lazer': 310}),
      now: DateTime(2026, 10, 15),
    );

    final insight = report.insights.firstWhere((i) => i.kind == InsightKind.belowAverage);

    expect(insight.title, contains('faltam R\$ 190,00'));
    expect(insight.progress!.fraction, closeTo(120 / 310, 0.001));
  });

  test('queda em relação ao período anterior', () {
    final history = [
      ..._history({'Transporte': 410}, months: 5).where((e) => e.date.month != 9),
      _expense('Transporte', 420, DateTime(2026, 9, 10)),
    ];

    final report = _build([_expense('Transporte', 328, DateTime(2026, 10, 5))], history);
    final drop = report.insights.firstWhere((i) => i.kind == InsightKind.drop);

    expect(drop.title, 'Transporte caiu 22% em relação ao mês anterior');
    expect(drop.tone, InsightTone.good);
  });

  test('em andamento compara com o mesmo ponto do período anterior', () {
    final report = _build(
      [_expense('Mercado', 100, DateTime(2026, 10, 2))],
      [
        ..._history({'Mercado': 500}),
        _expense('Mercado', 900, DateTime(2026, 9, 25)),
      ],
      now: DateTime(2026, 10, 10),
    );

    // O gasto de 25/09 fica depois do dia 10 e não entra na comparação.
    expect(report.insights.where((i) => i.kind == InsightKind.drop || i.kind == InsightKind.totalChange), isEmpty);
  });

  test('tendência de alta em períodos seguidos', () {
    final history = [
      _expense('Mercado', 1000, DateTime(2026, 7, 10)),
      _expense('Mercado', 1050, DateTime(2026, 8, 10)),
      _expense('Mercado', 1200, DateTime(2026, 9, 10)),
    ];
    final report = _build([_expense('Mercado', 1500, DateTime(2026, 10, 5))], history);

    expect(report.insights.any((i) => i.kind == InsightKind.trend || i.kind == InsightKind.rise), isTrue);
  });

  test('histórico estável não gera alertas', () {
    final report = _build(
      [_expense('Moradia', 2000, DateTime(2026, 10, 5)), _expense('Lazer', 300, DateTime(2026, 10, 6))],
      _history({'Moradia': 2000, 'Lazer': 300}),
    );

    expect(report.hasHistory, isTrue);
    expect(report.insights, isEmpty);
    expect(report.aboveCount, 0);
  });
}
