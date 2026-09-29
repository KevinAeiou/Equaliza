import 'package:flutter/widgets.dart';

import '../theme/theme_controller.dart';
import 'session_controller.dart';

/// Disponibiliza a sessão e o tema para a árvore de widgets.
class AppScope extends InheritedNotifier<Listenable> {
  AppScope({
    super.key,
    required this.session,
    required this.theme,
    required super.child,
  }) : super(notifier: Listenable.merge([session, theme]));

  final SessionController session;
  final ThemeController theme;

  static AppScope of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<AppScope>()!;

  /// Acesso sem registrar dependência, para uso em callbacks.
  static AppScope read(BuildContext context) =>
      context.getInheritedWidgetOfExactType<AppScope>()!;
}
