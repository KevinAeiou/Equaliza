import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/overlays.dart';
import 'auth_service.dart';
import 'invitation_invalid_screen.dart';
import 'accept_invitation_screen.dart';

/// No app não há como abrir o link do convite direto; a pessoa cola o link
/// (ou o código) e seguimos o mesmo fluxo do web: aceitar, entrar ou criar conta.
Future<void> openInvitationCode(BuildContext context) =>
    showFormSheet(context, (_) => const _InvitationCodeSheet());

class _InvitationCodeSheet extends StatefulWidget {
  const _InvitationCodeSheet();

  @override
  State<_InvitationCodeSheet> createState() => _InvitationCodeSheetState();
}

class _InvitationCodeSheetState extends State<_InvitationCodeSheet> {
  final _formKey = GlobalKey<FormState>();
  final _link = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _link.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final navigator = Navigator.of(context);
    final token = AuthService.extractToken(_link.text)!;

    setState(() => _loading = true);

    try {
      final invitation = await AuthService.validateInvitation(token);

      navigator
        ..pop()
        ..push(MaterialPageRoute(builder: (_) => AcceptInvitationScreen(invitation: invitation)));
    } on ApiException catch (error) {
      navigator
        ..pop()
        ..push(MaterialPageRoute(builder: (_) => InvitationInvalidScreen(message: error.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return FormSheet(
      icon: LucideIcons.mail,
      iconBackground: colors.incomeSoft,
      iconColor: colors.income,
      title: 'Usar convite',
      description: 'Cole o link do convite que você recebeu por e-mail para entrar na família.',
      formKey: _formKey,
      submitLabel: 'Continuar',
      loading: _loading,
      loadingLabel: 'Validando...',
      onSubmit: _submit,
      children: [
        AppTextField(
          label: 'Link do convite',
          controller: _link,
          placeholder: 'https://.../invitation/accept?token=...',
          keyboardType: TextInputType.url,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _submit(),
          validator: (value) =>
              AuthService.extractToken(value ?? '') == null ? 'Informe um link de convite válido' : null,
        ),
      ],
    );
  }
}
