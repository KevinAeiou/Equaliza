import 'package:flutter_test/flutter_test.dart';

import 'package:equaliza/core/utils/period.dart';
import 'package:equaliza/models/insights.dart';

void main() {
  test('lê o relatório de insights enviado pela API', () {
    final report = InsightsReport.fromJson({
      'has_expenses': true,
      'has_history': true,
      'has_previous': true,
      'history_periods': 6,
      'average_label': 'dos 6 meses anteriores',
      'above_count': 1,
      'below_count': 2,
      'dropped_count': 3,
      'comparisons': [
        {'name': 'Moradia', 'value': 2760.0, 'average': 2000.0, 'change': 0.38},
        {'name': 'Lazer', 'value': 90, 'average': null, 'change': null},
      ],
      'insights': [
        {
          'kind': 'weekday',
          'tone': 'neutral',
          'tag': 'Dia da semana',
          'title': 'Sábados concentram 40% das despesas',
          'body': '...',
          'bars': [],
          'progress': {'fraction': 0.4, 'start': 'a', 'end': 'b'},
          'spark': [
            {'label': 'Sáb', 'value': 'R\$ 10,00', 'fraction': 1.0, 'highlighted': true},
          ],
          'note': null,
        },
      ],
    });

    final insight = report.insights.single;

    expect(report.hasHistory, isTrue);
    expect(report.belowCount, 2);
    expect(report.comparisons.first.change, 0.38);
    expect(report.comparisons.last.average, isNull);
    expect(insight.kind, InsightKind.weekday);
    expect(insight.tone, InsightTone.neutral);
    expect(insight.progress!.fraction, 0.4);
    expect(insight.spark.single.highlighted, isTrue);
  });

  test('relatório vazio quando não há despesas', () {
    final report = InsightsReport.fromJson({'has_expenses': false});

    expect(report.hasExpenses, isFalse);
    expect(report.insights, isEmpty);
  });

  test('tipo de período enviado à API', () {
    expect(PeriodType.range.apiValue, 'PERIOD');
    expect(PeriodType.month.apiValue, 'MONTH');
  });
}
