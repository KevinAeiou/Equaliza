import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

const _locale = 'pt_BR';

final _currency = NumberFormat.currency(locale: _locale, symbol: 'R\$', decimalDigits: 2);
final _compact = NumberFormat.compact(locale: _locale);
final _percent = NumberFormat.decimalPercentPattern(locale: _locale, decimalDigits: 1);

/// "R$ 1.234,56", com espaço comum para não quebrar o alinhamento.
String formatCurrency(double value) => _currency.format(value).replaceAll(' ', ' ');

/// "+R$ 10,00" ou "−R$ 10,00".
String formatSignedCurrency(double value) =>
    '${value >= 0 ? '+' : '−'}${formatCurrency(value.abs())}';

/// "12 mil", usado no eixo do gráfico.
String formatCompact(double value) => _compact.format(value);

String formatPercent(double value) {
  final text = _percent.format(value).replaceAll(' ', '');

  // O padrão pt_BR mostra "33,0%"; o web omite o zero decimal.
  return text.replaceAll(',0%', '%');
}

String _stripDots(String value) => value.replaceAll('.', '');

/// "26 set".
String formatDayMonth(DateTime date) => _stripDots(DateFormat('d MMM', _locale).format(date));

/// "26 set 2026".
String formatDayMonthYear(DateTime date) =>
    _stripDots(DateFormat('d MMM yyyy', _locale).format(date));

/// "26 de set".
String formatDayOfMonth(DateTime date) =>
    _stripDots(DateFormat("d 'de' MMM", _locale).format(date));

/// "abr de 2026".
String formatMonthYearShort(DateTime date) =>
    _stripDots(DateFormat("MMM 'de' yyyy", _locale).format(date));

/// "28/09/2026".
String formatShortDate(DateTime date) => DateFormat('dd/MM/yyyy', _locale).format(date);

/// "28/09/2026 14:30".
String formatDateTime(DateTime date) => DateFormat('dd/MM/yyyy HH:mm', _locale).format(date);

String capitalize(String value) =>
    value.isEmpty ? value : value[0].toUpperCase() + value.substring(1);

String getInitials(String name) => name
    .split(' ')
    .where((part) => part.isNotEmpty)
    .take(2)
    .map((part) => part[0].toUpperCase())
    .join();

String getFirstName(String name) => name.split(' ').first;

/// Monograma de uma família sem o prefixo "Família" ("Família Souza" → "S").
String getFamilyMonogram(String name) {
  final initials = getInitials(name.replaceFirst(RegExp(r'^fam[ií]lia\s+', caseSensitive: false), ''));

  return initials.isEmpty ? 'F' : initials.substring(0, initials.length.clamp(0, 2));
}

/// Máscara de moeda: os dígitos digitados são centavos ("123" → "R$ 1,23").
class CurrencyInputFormatter extends TextInputFormatter {
  CurrencyInputFormatter({this.maxCents = 100000000000});

  final int maxCents;

  static double parse(String text) {
    final digits = text.replaceAll(RegExp(r'\D'), '');

    return digits.isEmpty ? 0 : int.parse(digits) / 100;
  }

  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');

    if (digits.isEmpty) return const TextEditingValue();

    final cents = int.parse(digits.length > 12 ? digits.substring(0, 12) : digits);

    if (cents > maxCents) return oldValue;

    final text = formatCurrency(cents / 100);

    return TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}
