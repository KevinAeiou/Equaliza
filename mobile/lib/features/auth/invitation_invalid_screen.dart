import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/basics.dart';
import 'auth_shell.dart';

class InvitationInvalidScreen extends StatelessWidget {
  const InvitationInvalidScreen({super.key, this.message});

  final String? message;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return AuthShell(
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: IconBadge(
            icon: LucideIcons.mailX,
            background: colors.expenseSoft,
            foreground: colors.expenseStrong,
            size: 48,
            iconSize: 20,
            radius: 14,
          ),
        ),
        AuthHeader(
          title: 'Convite indisponível',
          description: message ?? 'Este convite não pode mais ser usado.',
        ),
        Text(
          'Peça ao responsável pela família que envie um novo convite para concluir seu cadastro.',
          style: TextStyle(fontSize: 14, height: 1.7, color: colors.mutedForeground),
        ),
        FilledButton(
          onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
          child: const Text('Voltar para o login'),
        ),
      ],
    );
  }
}
