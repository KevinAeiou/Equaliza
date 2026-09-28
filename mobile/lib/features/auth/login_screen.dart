import 'package:flutter/material.dart';

import '../../core/network/api_exception.dart';
import '../../core/session/app_scope.dart';
import '../../core/widgets/form_fields.dart';
import 'auth_shell.dart';
import 'invitation_code_sheet.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

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

    try {
      await AppScope.read(context).session.login(_email.text.trim(), _password.text);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => AuthShell(
        children: [
          const AuthHeader(
            title: 'Entrar',
            description: 'Informe seu e-mail e senha para acessar sua conta.',
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
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    validator: validateEmail,
                    errorText: _error,
                  ),
                  const SizedBox(height: 20),
                  PasswordField(
                    label: 'Senha',
                    controller: _password,
                    placeholder: 'Sua senha',
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _submit(),
                    validator: (value) => (value ?? '').isEmpty ? 'A senha é obrigatória.' : null,
                  ),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: _loading ? null : _submit,
                    child: Text(_loading ? 'Entrando...' : 'Entrar'),
                  ),
                ],
              ),
            ),
          ),
          Column(
            children: [
              AuthSwitchLink(
                question: 'Ainda não tem uma conta?',
                action: 'Criar conta',
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const RegisterScreen()),
                ),
              ),
              AuthSwitchLink(
                question: 'Recebeu um convite?',
                action: 'Usar convite',
                onTap: () => openInvitationCode(context),
              ),
            ],
          ),
        ],
      );
}
