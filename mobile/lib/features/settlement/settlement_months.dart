import 'package:intl/intl.dart';

import '../../core/utils/formatters.dart';

final _key = DateFormat('yyyy-MM');

/// Meses do acerto de contas circulam como `AAAA-MM`, o formato da API.
String monthKey(DateTime date) => _key.format(date);

String currentMonthKey() => monthKey(DateTime.now());

DateTime _parse(String month) {
  final parts = month.split('-');

  return DateTime(int.parse(parts[0]), int.parse(parts[1]));
}

String shiftMonthKey(String month, int step) {
  final date = _parse(month);

  return monthKey(DateTime(date.year, date.month + step));
}

/// "2026-11" → "Novembro de 2026"
String monthLabel(String month) => capitalize(DateFormat("MMMM 'de' yyyy", 'pt_BR').format(_parse(month)));

/// "2026-11" → "Nov/2026"
String monthShortLabel(String month) =>
    capitalize(DateFormat('MMM/yyyy', 'pt_BR').format(_parse(month)).replaceAll('.', ''));
