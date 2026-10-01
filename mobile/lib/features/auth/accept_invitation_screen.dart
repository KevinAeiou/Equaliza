import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/session/app_scope.dart';
import '../../core/session/session_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/basics.dart';
import '../../models/member.dart';
import 'auth_shell.dart';
import 'login_screen.dart';
import 'register_screen.dart';

/// Convite validado: quem já está conectado entra na família; os demais escolhem entre
/// entrar numa conta existente ou criar uma nova, como a página `/invitation/accept` do web.
class AcceptInvitationScreen extends StatefulWidget {
  const AcceptInvitationScreen({super.key, required this.invitation});

  final InvitationPreview invitation;

  @override
  State<AcceptInvitationScreen> createState() => _AcceptInvitationScreenState();
}

class _AcceptInvitationScreenState extends State<AcceptInvitationScreen> {
  bool _accepting = false;
  String? _error;

  Future<void> _accept() async {
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    setState(() {
      _accepting = true;
      _error = null;
    });

    try {
      final name = await AppScope.read(context).session.acceptInvitation(widget.invitation.token);

      navigator.popUntil((route) => route.isFirst);
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text('Você entrou na família $name!')));
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _accepting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final session = AppScope.of(context).session;
    final loggedIn = session.status == SessionStatus.authenticated;
    final invitedEmail = widget.invitation.email;
    final userEmail = session.maybeUser?.email ?? '';
    final wrongAccount =
        loggedIn && invitedEmail.isNotEmpty && invitedEmail.toLowerCase() != userEmail.toLowerCase();

    return AuthShell(
      footer: loggedIn
          ? null
          : AuthSwitchLink(
              question: 'Ainda não tem uma conta?',
              action: 'Criar conta',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => RegisterScreen(invitation: widget.invitation)),
              ),
            ),
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: IconBadge(
            icon: LucideIcons.users,
            background: colors.incomeSoft,
            foreground: colors.income,
            size: 48,
            iconSize: 20,
            radius: 14,
          ),
        ),
        AuthHeader(
          title: 'Você foi convidado',
          description: 'Você recebeu um convite para participar da família ${widget.invitation.familyName}.',
        ),
        if (loggedIn) ...[
          Text(
            'Você está conectado como $userEmail. Ao aceitar, a família será adicionada às suas '
            'famílias e passará a ser a família atual.',
            style: TextStyle(fontSize: 14, height: 1.7, color: colors.mutedForeground),
          ),
          if (wrongAccount)
            Text(
              'Este convite foi enviado para $invitedEmail. Entre com essa conta para aceitá-lo.',
              style: TextStyle(fontSize: 14, height: 1.7, color: colors.expenseStrong),
            ),
          if (_error != null)
            Text(_error!, style: TextStyle(fontSize: 14, height: 1.7, color: colors.expenseStrong)),
          FilledButton(
            onPressed: _accepting ? null : _accept,
            child: Text(_accepting ? 'Entrando...' : 'Entrar na família'),
          ),
        ] else
          FilledButton(
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => LoginScreen(invitation: widget.invitation)),
            ),
            child: const Text('Já tenho conta'),
          ),
      ],
    );
  }
}
