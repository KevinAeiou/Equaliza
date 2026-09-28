import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/session/app_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/form_fields.dart';
import '../../models/member.dart';
import 'auth_shell.dart';

/// Cadastro com criação de família, ou aceite de convite quando [invitation] é informado.
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key, this.invitation});

  final InvitationPreview? invitation;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _familyName = TextEditingController();
  late final _email = TextEditingController(text: widget.invitation?.email);
  final _password = TextEditingController();
  final _confirmation = TextEditingController();

  bool _loading = false;
  Map<String, String> _errors = {};

  bool get _invitationMode => widget.invitation != null;

  @override
  void dispose() {
    for (final controller in [_firstName, _lastName, _familyName, _email, _password, _confirmation]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _errors = {});

    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    try {
      await AppScope.read(context).session.register(
            firstName: _firstName.text.trim(),
            lastName: _lastName.text.trim(),
            email: _email.text.trim(),
            password: _password.text,
            familyName: _invitationMode ? widget.invitation!.familyName : _familyName.text.trim(),
            token: widget.invitation?.token,
          );

      // A sessão passa a ser a autenticada; volta à raiz, que mostra o app.
      if (mounted) Navigator.of(context).popUntil((route) => route.isFirst);
    } on ApiException catch (error) {
      if (!mounted) return;

      setState(() {
        _errors = error.fieldErrors.isEmpty ? {'email': error.message} : error.fieldErrors;
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return AuthShell(
      children: [
        AuthHeader(
          title: _invitationMode ? 'Aceitar convite' : 'Criar conta',
          description: _invitationMode
              ? 'Crie sua conta para começar a organizar as finanças junto com a família.'
              : 'Crie sua conta e sua família para começar a organizar as finanças.',
        ),
        if (_invitationMode)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: colors.incomeSoft, borderRadius: BorderRadius.circular(14)),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Icon(LucideIcons.mailCheck, size: 16, color: colors.income),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text.rich(
                    TextSpan(
                      text: 'Você recebeu um convite para participar da ',
                      children: [
                        TextSpan(
                          text: widget.invitation!.familyName,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        const TextSpan(text: '.'),
                      ],
                    ),
                    style: const TextStyle(fontSize: 14, height: 1.43),
                  ),
                ),
              ],
            ),
          ),
        Form(
          key: _formKey,
          child: AutofillGroup(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AppTextField(
                  label: 'Nome',
                  controller: _firstName,
                  placeholder: 'Seu nome',
                  autofillHints: const [AutofillHints.givenName],
                  textCapitalization: TextCapitalization.words,
                  errorText: _errors['first_name'],
                  validator: (value) => requiredMin(value, 3, 'Informe seu primeiro nome'),
                ),
                const SizedBox(height: 20),
                AppTextField(
                  label: 'Sobrenome',
                  controller: _lastName,
                  placeholder: 'Seu sobrenome',
                  autofillHints: const [AutofillHints.familyName],
                  textCapitalization: TextCapitalization.words,
                  errorText: _errors['last_name'],
                  validator: (value) => requiredMin(value, 3, 'Informe seu sobrenome'),
                ),
                if (!_invitationMode) ...[
                  const SizedBox(height: 20),
                  AppTextField(
                    label: 'Nome da família',
                    controller: _familyName,
                    placeholder: 'Ex.: Família Silva',
                    textCapitalization: TextCapitalization.words,
                    errorText: _errors['family_name'],
                    validator: (value) => (value ?? '').trim().isEmpty
                        ? null
                        : requiredMin(value, 3, 'Informe o nome da família'),
                  ),
                ],
                const SizedBox(height: 20),
                AppTextField(
                  label: 'E-mail',
                  controller: _email,
                  enabled: !_invitationMode,
                  placeholder: 'voce@exemplo.com',
                  keyboardType: TextInputType.emailAddress,
                  autofillHints: const [AutofillHints.email],
                  errorText: _errors['email'],
                  validator: validateEmail,
                ),
                const SizedBox(height: 20),
                PasswordField(
                  label: 'Senha',
                  controller: _password,
                  placeholder: 'Crie uma senha',
                  autofillHints: const [AutofillHints.newPassword],
                  validator: (value) =>
                      (value ?? '').length < 8 ? 'A senha deve possuir no mínimo 8 caracteres' : null,
                ),
                const SizedBox(height: 20),
                PasswordField(
                  label: 'Confirmar senha',
                  controller: _confirmation,
                  placeholder: 'Repita a senha',
                  autofillHints: const [AutofillHints.newPassword],
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _submit(),
                  validator: (value) => value != _password.text ? 'As senhas não coincidem' : null,
                ),
                if (_errors['password'] != null) ...[
                  const SizedBox(height: 6),
                  Text(_errors['password']!, style: TextStyle(fontSize: 12, color: colors.destructive)),
                ],
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _loading ? null : _submit,
                  child: Text(
                    _loading
                        ? 'Criando conta...'
                        : _invitationMode
                            ? 'Criar conta e entrar na família'
                            : 'Criar conta',
                  ),
                ),
              ],
            ),
          ),
        ),
        AuthSwitchLink(
          question: 'Já tem uma conta?',
          action: 'Entrar',
          onTap: () => Navigator.of(context).popUntil((route) => route.isFirst),
        ),
      ],
    );
  }
}
