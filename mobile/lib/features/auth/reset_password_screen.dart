import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/form_fields.dart';
import 'auth_service.dart';
import 'auth_shell.dart';

/// Define a nova senha a partir do `uid` e `token` do link recebido por e-mail.
class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key, required this.uid, required this.token});

  final String uid;
  final String token;

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _password = TextEditingController();
  final _confirmation = TextEditingController();

  bool _loading = false;
  bool _invalidLink = false;
  String? _error;

  @override
  void dispose() {
    _password.dispose();
    _confirmation.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);

    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    try {
      await AuthService.confirmPasswordReset(
        uid: widget.uid,
        token: widget.token,
        password: _password.text,
      );

      navigator.popUntil((route) => route.isFirst);
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(content: Text('Senha redefinida com sucesso! Faça login com a nova senha.')),
        );
    } on ApiException catch (error) {
      if (!mounted) return;

      setState(() {
        // Link inválido ou expirado vem em `detail`, sem erro de campo.
        if (error.fieldErrors.isEmpty && error.status == 400) {
          _invalidLink = true;
        } else {
          _error = error.fieldErrors['password'] ?? error.message;
        }
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_invalidLink) {
      return AuthShell(
        tallBand: true,
        children: [
          const AuthHeader(
            title: 'Link inválido',
            description: 'O link de recuperação é inválido ou expirou. Solicite um novo.',
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
            child: const Text('Voltar para o login'),
          ),
        ],
      );
    }

    return AuthShell(
      tallBand: true,
      children: [
        const AuthHeader(title: 'Nova senha', description: 'Crie uma nova senha para acessar sua conta.'),
        Form(
          key: _formKey,
          child: AutofillGroup(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                PasswordField(
                  label: 'Nova senha',
                  controller: _password,
                  placeholder: 'Mínimo de 8 caracteres',
                  icon: LucideIcons.lock,
                  autofillHints: const [AutofillHints.newPassword],
                  footer: PasswordRule(controller: _password),
                  validator: (value) =>
                      (value ?? '').length < 8 ? 'A senha deve possuir no mínimo 8 caracteres' : null,
                ),
                const SizedBox(height: 18),
                PasswordField(
                  label: 'Confirmar nova senha',
                  controller: _confirmation,
                  placeholder: 'Repita a nova senha',
                  icon: LucideIcons.lock,
                  autofillHints: const [AutofillHints.newPassword],
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _submit(),
                  validator: (value) => value != _password.text ? 'As senhas não coincidem' : null,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 6),
                  Text(_error!, style: TextStyle(fontSize: 12, color: context.colors.destructive)),
                ],
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _loading ? null : _submit,
                  child: Text(_loading ? 'Salvando...' : 'Redefinir senha'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
