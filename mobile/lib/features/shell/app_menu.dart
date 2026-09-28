import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/session/app_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/brand.dart';
import '../../core/widgets/overlays.dart';
import '../settings/profile_sheet.dart';
import '../settings/settings_screen.dart';
import 'app_section.dart';

/// Menu lateral de tela cheia, como o `SheetNavigation` do web.
class AppMenu extends StatelessWidget {
  const AppMenu({super.key, required this.current, required this.onNavigate});

  final AppSection current;
  final ValueChanged<AppSection> onNavigate;

  Future<void> _changeFamily(BuildContext context, int familyId) async {
    final session = AppScope.read(context).session;

    try {
      await session.changeCurrentFamily(familyId);
    } on ApiException catch (error) {
      if (context.mounted) showMessage(context, error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final session = AppScope.of(context).session;
    final user = session.user;
    final sections = AppSection.values.where((section) => !section.adminOnly || user.isAdmin);

    // O menu é fechado antes de abrir perfil ou configurações; o contexto do
    // Navigator continua válido depois disso.
    final navigator = Navigator.of(context);
    final rootContext = navigator.context;

    void closeAnd(VoidCallback action) {
      navigator.pop();
      action();
    }

    return Drawer(
      width: MediaQuery.sizeOf(context).width,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              height: 56,
              padding: const EdgeInsets.only(left: 16, right: 6),
              decoration: BoxDecoration(border: Border(bottom: BorderSide(color: colors.border))),
              child: Row(
                children: [
                  const AppLogo(height: 29),
                  const Spacer(),
                  IconButton(
                    tooltip: 'Fechar menu',
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(LucideIcons.x, size: 18, color: colors.mutedForeground),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 20),
                children: [
                  const _SectionTitle('Navegação'),
                  for (final section in sections)
                    _MenuRow(
                      icon: section.icon,
                      label: section.label,
                      active: section == current,
                      onTap: () => onNavigate(section),
                    ),
                  const SizedBox(height: 24),
                  const _SectionTitle('Família'),
                  if (user.families.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: Text(
                        'Você ainda não participa de nenhuma família.',
                        style: TextStyle(fontSize: 14, color: colors.mutedForeground),
                      ),
                    ),
                  for (final family in user.families)
                    _MenuRow(
                      leading: FamilyMonogram(name: family.name, current: family.id == user.currentFamily?.id),
                      label: family.name,
                      active: family.id == user.currentFamily?.id,
                      activeTextColor: colors.foreground,
                      trailing: family.id == user.currentFamily?.id
                          ? Icon(LucideIcons.check, size: 16, color: colors.income)
                          : null,
                      onTap: family.id == user.currentFamily?.id
                          ? null
                          : () => _changeFamily(context, family.id),
                    ),
                  _MenuRow(
                    icon: LucideIcons.settings2,
                    label: 'Gerenciar famílias',
                    active: false,
                    onTap: () => onNavigate(AppSection.family),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(border: Border(top: BorderSide(color: colors.border))),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      UserAvatar(name: user.fullName, avatarId: user.avatarId),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user.fullName,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                            ),
                            Text(
                              user.role != null ? '${user.role} · ${user.email}' : user.email,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 12, color: colors.mutedForeground),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () =>
                              closeAnd(() => showFormSheet(rootContext, (_) => const ProfileSheet())),
                          icon: const Icon(LucideIcons.userRound, size: 16),
                          label: const Text('Perfil'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () =>
                              closeAnd(() => pushPanel(rootContext, (_) => const SettingsScreen())),
                          icon: const Icon(LucideIcons.settings, size: 16),
                          label: const Text('Configurações'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextButton.icon(
                    style: TextButton.styleFrom(foregroundColor: colors.destructive),
                    onPressed: () => closeAnd(session.logout),
                    icon: const Icon(LucideIcons.logOut, size: 16),
                    label: const Text('Sair'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(12, 0, 12, 4),
        child: Text(
          text.toUpperCase(),
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            letterSpacing: 0.5,
            color: context.colors.mutedForeground,
          ),
        ),
      );
}

class _MenuRow extends StatelessWidget {
  const _MenuRow({
    required this.label,
    required this.active,
    required this.onTap,
    this.icon,
    this.leading,
    this.trailing,
    this.activeTextColor,
  });

  final String label;
  final bool active;
  final VoidCallback? onTap;
  final IconData? icon;
  final Widget? leading;
  final Widget? trailing;
  final Color? activeTextColor;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final foreground = active || leading != null ? colors.foreground : colors.mutedForeground;

    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Material(
        color: active ? colors.muted : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                leading ?? Icon(icon, size: 16, color: active ? colors.income : foreground),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14,
                      color: foreground,
                      fontWeight: active ? FontWeight.w500 : FontWeight.w400,
                    ),
                  ),
                ),
                ?trailing,
              ],
            ),
          ),
        ),
      ),
    );
  }
}
