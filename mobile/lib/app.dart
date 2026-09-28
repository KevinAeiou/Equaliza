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

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: context.colors.background,
        body: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppLogo(height: 40),
              SizedBox(height: 24),
              SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2)),
            ],
          ),
        ),
      );
}
