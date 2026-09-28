import 'package:flutter/material.dart';

/// Cores e temas alinhados à identidade visual do frontend web.
abstract final class AppTheme {
  static const Color primary = Color(0xFF0E7C66);

  static ThemeData get light => _build(Brightness.light);

  static ThemeData get dark => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primary,
      brightness: brightness,
    ).copyWith(primary: primary, onPrimary: Colors.white);

    return ThemeData(
      colorScheme: colorScheme,
      useMaterial3: true,
    );
  }
}
