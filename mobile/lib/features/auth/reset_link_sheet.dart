import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/overlays.dart';
import 'auth_service.dart';
import 'reset_password_screen.dart';

/// No app não há como abrir o link do e-mail direto; a pessoa cola o link
/// e seguimos para a definição da nova senha, como no web.
Future<void> openResetLink(BuildContext context) => showFormSheet(context, (_) => const _ResetLinkSheet());

class _ResetLinkSheet extends StatefulWidget {
  const _ResetLinkSheet();

  @override
  State<_ResetLinkSheet> createState() => _ResetLinkSheetState();
}

class _ResetLinkSheetState extends State<_ResetLinkSheet> {
  final _formKey = GlobalKey<FormState>();
  final _link = TextEditingController();

  @override
  void dispose() {
    _link.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    final reset = AuthService.extractResetLink(_link.text)!;

    Navigator.of(context)
      ..pop()
      ..push(MaterialPageRoute(builder: (_) => ResetPasswordScreen(uid: reset.uid, token: reset.token)));
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return FormSheet(
      icon: LucideIcons.keyRound,
      iconBackground: colors.incomeSoft,
      iconColor: colors.income,
      title: 'Link de recuperação',
      description: 'Cole o link que você recebeu por e-mail para criar uma nova senha.',
      formKey: _formKey,
      submitLabel: 'Continuar',
      loading: false,
      loadingLabel: 'Validando...',
      onSubmit: _submit,
      children: [
        AppTextField(
          label: 'Link de recuperação',
          controller: _link,
          placeholder: 'https://.../reset-password?uid=...&token=...',
          keyboardType: TextInputType.url,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _submit(),
          validator: (value) =>
              AuthService.extractResetLink(value ?? '') == null ? 'Informe um link de recuperação válido' : null,
        ),
      ],
    );
  }
}
