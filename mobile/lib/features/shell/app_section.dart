import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../models/finance.dart';

/// Seções do app, na mesma ordem do menu do web.
enum AppSection {
  dashboard('Dashboard', LucideIcons.house),
  finance('Finanças', LucideIcons.wallet),
  category('Categorias', LucideIcons.tags, adminOnly: true),
  member('Membros', LucideIcons.users, adminOnly: true),
  invitation('Convites', LucideIcons.mail, adminOnly: true),
  family('Famílias', LucideIcons.usersRound);

  const AppSection(this.label, this.icon, {this.adminOnly = false});

  final String label;
  final IconData icon;

  /// Exige responsável ou administrador (o backend também protege).
  final bool adminOnly;
}

/// Troca de seção; [entryType] escolhe a aba ao abrir Finanças.
typedef NavigateCallback = void Function(AppSection section, {EntryType? entryType});

/// Permite que as telas troquem de seção (ex.: "Ver todas" no dashboard).
class ShellScope extends InheritedWidget {
  const ShellScope({super.key, required this.current, required this.navigate, required super.child});

  final AppSection current;
  final NavigateCallback navigate;

  static ShellScope of(BuildContext context) => context.dependOnInheritedWidgetOfExactType<ShellScope>()!;

  @override
  bool updateShouldNotify(ShellScope oldWidget) => oldWidget.current != current;
}
