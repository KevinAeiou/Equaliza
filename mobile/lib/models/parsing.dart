/// A API envia valores decimais como texto (`"1234.50"`).
double toDouble(Object? value) => switch (value) {
      num number => number.toDouble(),
      String text => double.tryParse(text) ?? 0,
      _ => 0,
    };

DateTime? toDate(Object? value) =>
    value is String && value.isNotEmpty ? DateTime.tryParse(value)?.toLocal() : null;

/// Datas sem horário (`"2026-09-28"`) são lidas como data local, sem fuso.
DateTime toDay(Object? value) {
  final parsed = value is String ? DateTime.tryParse(value) : null;

  return parsed == null ? DateTime.now() : DateTime(parsed.year, parsed.month, parsed.day);
}
