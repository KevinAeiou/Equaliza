import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/widgets/form_fields.dart';
import 'auth_service.dart';
import 'auth_shell.dart';
import 'reset_link_sheet.dart';

/// Pede o e-mail de recuperação. Como no web, a resposta não revela se o e-mail existe.
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();

  bool _loading = false;
  bool _sent = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);

    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    try {
      await AuthService.requestPasswordReset(_email.text.trim());

      if (mounted) setState(() => _sent = true);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => AuthShell(
        tallBand: true,
        footer: AuthSwitchLink(
          question: 'Lembrou da senha?',
          action: 'Voltar ao login',
          onTap: () => Navigator.of(context).popUntil((route) => route.isFirst),
        ),
        children: [
          AuthHeader(
            title: 'Recuperar senha',
            description: _sent
                ? 'Se o e-mail estiver cadastrado, você receberá as instruções para redefinir a senha. Verifique também a caixa de spam.'
                : 'Informe seu e-mail e enviaremos um link para você criar uma nova senha.',
          ),
          if (_sent)
            FilledButton(
              onPressed: () => openResetLink(context),
              child: const Text('Já recebi o e-mail'),
            )
          else
            Form(
              key: _formKey,
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
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _submit(),
                    validator: validateEmail,
                    errorText: _error,
                  ),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: _loading ? null : _submit,
                    child: Text(_loading ? 'Enviando...' : 'Enviar link'),
                  ),
                ],
              ),
            ),
        ],
      );
}
