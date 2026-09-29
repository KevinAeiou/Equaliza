import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Preferência de tema (claro, escuro ou do sistema), salva no dispositivo.
class ThemeController extends ChangeNotifier {
  static const _key = 'theme_mode';

  ThemeMode _mode = ThemeMode.system;

  ThemeMode get mode => _mode;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();

    _mode = ThemeMode.values.firstWhere(
      (mode) => mode.name == prefs.getString(_key),
      orElse: () => ThemeMode.system,
    );

    notifyListeners();
  }

  Future<void> setMode(ThemeMode mode) async {
    if (mode == _mode) return;

    _mode = mode;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, mode.name);
  }
}
