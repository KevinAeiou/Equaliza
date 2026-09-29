import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/session/app_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/overlays.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  static const _options = [
    (ThemeMode.light, 'Claro', LucideIcons.sun),
    (ThemeMode.dark, 'Escuro', LucideIcons.moon),
    (ThemeMode.system, 'Sistema', LucideIcons.monitor),
  ];

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final theme = AppScope.of(context).theme;

    return FullScreenPanel(
      title: 'Configurações',
      description: 'Personalize sua conta e suas preferências.',
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Text('Aparência', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(
            '"Sistema" acompanha o tema claro ou escuro do seu dispositivo.',
            style: TextStyle(fontSize: 14, color: colors.mutedForeground),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              for (final (index, (mode, label, icon)) in _options.indexed) ...[
                if (index > 0) const SizedBox(width: 8),
                Expanded(
                  child: _ThemeOption(
                    label: label,
                    icon: icon,
                    selected: theme.mode == mode,
                    onTap: () => theme.setMode(mode),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 32),
          const Text('Conta', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          // A troca de senha ainda não existe no backend; fica visível, mas desabilitada, como no web.
          Opacity(
            opacity: 0.6,
            child: Container(
              height: 48,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: colors.border),
              ),
              child: Row(
                children: [
                  Icon(LucideIcons.keyRound, size: 16, color: colors.mutedForeground),
                  const SizedBox(width: 12),
                  const Expanded(child: Text('Alterar senha', style: TextStyle(fontSize: 14))),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: colors.muted, borderRadius: BorderRadius.circular(999)),
                    child: Text('Em breve', style: TextStyle(fontSize: 12, color: colors.mutedForeground)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ThemeOption extends StatelessWidget {
  const _ThemeOption({required this.label, required this.icon, required this.selected, required this.onTap});

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Semantics(
      selected: selected,
      button: true,
      child: Material(
        color: selected ? colors.incomeSoft : Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: selected ? colors.brand : colors.border, width: selected ? 2 : 1),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
            child: Column(
              children: [
                Icon(icon, size: 20, color: selected ? colors.income : colors.mutedForeground),
                const SizedBox(height: 8),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: selected ? colors.foreground : colors.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
