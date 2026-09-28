import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'app.dart';
import 'core/config/env.dart';
import 'core/network/api_client.dart';
import 'core/session/session_controller.dart';
import 'core/theme/theme_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Future.wait([initializeDateFormatting('pt_BR'), setupApi()]);

  final theme = ThemeController();
  final session = SessionController();

  await theme.load();

  // Um build de release sem a URL da API (ou com HTTP) não conseguiria entrar;
  // melhor explicar o motivo do que falhar em todas as requisições.
  final problem = Env.problem;

  if (problem != null) {
    runApp(ConfigErrorApp(message: problem));
    return;
  }

  runApp(EqualizaApp(session: session, theme: theme));

  // A sessão é restaurada com o app já na tela de carregamento.
  session.restore();
}
