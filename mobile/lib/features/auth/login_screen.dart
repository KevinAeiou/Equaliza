import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/session/app_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/form_fields.dart';
import '../../models/member.dart';
import 'auth_shell.dart';
import 'forgot_password_screen.dart';
import 'invitation_code_sheet.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.invitation});

  /// Convite a aceitar logo após o login, quando a pessoa chegou por um link.
  final InvitationPreview? invitation;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();

  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);

    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    final session = AppScope.read(context).session;
    final invitation = widget.invitation;

    try {
      await session.login(_email.text.trim(), _password.text);

      if (invitation != null) {
        // A sessão já é a autenticada: volta à raiz, que mostra o app, e avisa o resultado.
        navigator.popUntil((route) => route.isFirst);

        String message;
        try {
          message = 'Você entrou na família ${await session.acceptInvitation(invitation.token)}!';
        } on ApiException catch (error) {
          message = error.message;
        }

        messenger
          ..hideCurrentSnackBar()
          ..showSnackBar(SnackBar(content: Text(message)));
      }
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => AuthShell(
        footer: AuthSwitchLink(
          question: 'Ainda não tem uma conta?',
          action: 'Criar conta',
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => RegisterScreen(invitation: widget.invitation)),
          ),
        ),
        children: [
          AuthHeader(
            title: 'Bem-vindo de volta',
            description: widget.invitation == null
                ? 'Entre com seu e-mail e senha para acessar sua conta.'
                : 'Entre com sua conta para aceitar o convite da família ${widget.invitation!.familyName}.',
          ),
          Form(
            key: _formKey,
            child: AutofillGroup(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  AppTextField(
                    label: 'E-mail',
                    controller: _email,
                    placeholder: 'voce@exemplo.com',
                    icon: LucideIcons.mail,
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    validator: validateEmail,
                    errorText: _error,
                  ),
                  const SizedBox(height: 18),
                  PasswordField(
                    label: 'Senha',
                    controller: _password,
                    placeholder: 'Sua senha',
                    icon: LucideIcons.lock,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _submit(),
                    validator: (value) => (value ?? '').isEmpty ? 'A senha é obrigatória.' : null,
                  ),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const ForgotPasswordScreen()),
                      ),
                      child: const Text('Esqueci minha senha'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: _loading ? null : _submit,
                    child: _loading
                        ? const Text('Entrando...')
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Entrar'),
                              SizedBox(width: 8),
                              Icon(LucideIcons.arrowRight, size: 18, color: Colors.white),
                            ],
                          ),
                  ),
                ],
              ),
            ),
          ),
          if (widget.invitation == null) ...[
            const AuthDivider(),
            OutlinedButton.icon(
              onPressed: () => openInvitationCode(context),
              icon: Icon(LucideIcons.ticket, size: 18, color: context.colors.income),
              label: const Text('Tenho um código de convite'),
            ),
          ],
        ],
      );
}
