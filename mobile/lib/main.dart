import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'app.dart';
import 'core/network/api_client.dart';
import 'core/session/session_controller.dart';
import 'core/theme/theme_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Future.wait([initializeDateFormatting('pt_BR'), setupApi()]);

  final theme = ThemeController();
  final session = SessionController();

  await theme.load();

  runApp(EqualizaApp(session: session, theme: theme));

  // A sessão é restaurada com o app já na tela de carregamento.
  session.restore();
}
