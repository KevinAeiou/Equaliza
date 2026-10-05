import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/security/biometric_service.dart';
import '../../core/session/app_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/overlays.dart';
import '../auth/auth_service.dart';

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
          const _BiometricTile(),
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

/// Liga ou desliga o login por biometria. Só aparece em aparelhos com biometria cadastrada.
class _BiometricTile extends StatefulWidget {
  const _BiometricTile();

  @override
  State<_BiometricTile> createState() => _BiometricTileState();
}

class _BiometricTileState extends State<_BiometricTile> {
  bool _available = false;
  bool _enabled = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final available = await BiometricService.isAvailable();
    final enabled = available && await BiometricService.isEnabled();

    if (!mounted) return;

    setState(() {
      _available = available;
      _enabled = enabled;
    });
  }

  Future<void> _toggle(bool value) async {
    if (!value) {
      await BiometricService.clear();
      if (mounted) setState(() => _enabled = false);

      return;
    }

    final session = AppScope.read(context).session;
    final messenger = ScaffoldMessenger.of(context);
    final email = session.user.email;
    final password = await _askPassword();

    if (password == null) return;

    // A senha é validada no servidor antes de ir para o cofre do aparelho.
    try {
      await AuthService.login(email, password);
    } on ApiException catch (error) {
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(error.message)));

      return;
    }

    if (!await BiometricService.authenticate('Confirme para ativar o login por biometria')) return;

    await BiometricService.save(email, password);
    if (mounted) setState(() => _enabled = true);
  }

  Future<String?> _askPassword() {
    final controller = TextEditingController();

    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirme sua senha'),
        content: TextField(
          controller: controller,
          obscureText: true,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Sua senha'),
          onSubmitted: (value) => Navigator.pop(context, value),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(context, controller.text), child: const Text('Continuar')),
        ],
      ),
    ).whenComplete(controller.dispose);
  }

  @override
  Widget build(BuildContext context) {
    if (!_available) return const SizedBox.shrink();

    final colors = context.colors;

    return Container(
      padding: const EdgeInsets.only(left: 16, right: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: [
          Icon(LucideIcons.fingerprintPattern, size: 16, color: colors.mutedForeground),
          const SizedBox(width: 12),
          const Expanded(child: Text('Entrar com biometria', style: TextStyle(fontSize: 14))),
          Switch(value: _enabled, onChanged: _toggle),
        ],
      ),
    );
  }
}
