import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/session/app_scope.dart';
import 'core/session/session_controller.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_controller.dart';
import 'core/widgets/brand.dart';
import 'core/widgets/error_view.dart';
import 'features/auth/login_screen.dart';
import 'features/shell/home_shell.dart';

class EqualizaApp extends StatelessWidget {
  const EqualizaApp({super.key, required this.session, required this.theme});

  final SessionController session;
  final ThemeController theme;

  @override
  Widget build(BuildContext context) => AppScope(
        session: session,
        theme: theme,
        child: ListenableBuilder(
          listenable: theme,
          builder: (context, _) => MaterialApp(
            title: 'Equaliza',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light,
            darkTheme: AppTheme.dark,
            themeMode: theme.mode,
            locale: const Locale('pt', 'BR'),
            supportedLocales: const [Locale('pt', 'BR')],
            localizationsDelegates: GlobalMaterialLocalizations.delegates,
            home: const _AuthGate(),
            onUnknownRoute: (_) => MaterialPageRoute(builder: (_) => const NotFoundScreen()),
          ),
        ),
      );
}

/// Mostra o login ou o app conforme a sessão, como o `AuthenticatedRoute` do web.
class _AuthGate extends StatelessWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context) {
    final session = AppScope.of(context).session;

    return switch (session.status) {
      SessionStatus.loading => const _Splash(),
      SessionStatus.unauthenticated => const LoginScreen(),
      SessionStatus.authenticated => const HomeShell(),
    };
  }
}

class _Splash extends StatefulWidget {
  const _Splash();

  @override
  State<_Splash> createState() => _SplashState();
}

class _SplashState extends State<_Splash> {
  bool _slow = false;
  late final Timer _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer(const Duration(seconds: 4), () => setState(() => _slow = true));
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: context.colors.background,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const AppLogo(height: 40),
                const SizedBox(height: 24),
                const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2)),
                // O plano gratuito do Render desliga o backend quando ocioso; a primeira
                // requisição pode levar até um minuto.
                AnimatedOpacity(
                  opacity: _slow ? 1 : 0,
                  duration: const Duration(milliseconds: 300),
                  child: Padding(
                    padding: const EdgeInsets.only(top: 24),
                    child: Text(
                      'Conectando ao servidor. Na primeira abertura do dia isso pode levar até um minuto.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, color: context.colors.mutedForeground),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}

/// Exibida quando o build foi gerado sem uma URL de API válida para produção.
class ConfigErrorApp extends StatelessWidget {
  const ConfigErrorApp({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Equaliza',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        home: Builder(
          builder: (context) => Scaffold(
            backgroundColor: context.colors.background,
            body: SafeArea(
              child: ErrorView(
                variant: ErrorVariant.error,
                code: 'Configuração inválida',
                title: 'O app não está configurado',
                description: message,
              ),
            ),
          ),
        ),
      );
}
