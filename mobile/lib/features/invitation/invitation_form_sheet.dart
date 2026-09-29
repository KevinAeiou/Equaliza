import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/overlays.dart';
import 'invitation_service.dart';

/// Envio de convite por e-mail. Retorna `true` quando enviado.
class InvitationFormSheet extends StatefulWidget {
  const InvitationFormSheet({super.key});

  @override
  State<InvitationFormSheet> createState() => _InvitationFormSheetState();
}

class _InvitationFormSheetState extends State<InvitationFormSheet> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  bool _loading = false;
  String? _emailError;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _emailError = null);

    if (!_formKey.currentState!.validate()) return;

    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    setState(() => _loading = true);

    try {
      await InvitationService.create(_email.text.trim());

      navigator.pop(true);
      messenger.showSnackBar(const SnackBar(content: Text('Convite enviado.')));
    } on ApiException catch (error) {
      if (!mounted) return;

      setState(() {
        _loading = false;
        _emailError = error.fieldErrors['email'] ?? error.message;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return FormSheet(
      icon: LucideIcons.mail,
      iconBackground: colors.muted,
      iconColor: colors.foreground,
      title: 'Convidar para a família',
      description: 'Enviaremos um link para a pessoa criar a conta e entrar na família. '
          'O convite vale por 7 dias e só pode ser usado uma vez.',
      formKey: _formKey,
      submitLabel: 'Enviar convite',
      loading: _loading,
      loadingLabel: 'Enviando...',
      onSubmit: _submit,
      children: [
        AppTextField(
          label: 'E-mail',
          controller: _email,
          placeholder: 'pessoa@exemplo.com',
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _submit(),
          errorText: _emailError,
          validator: validateEmail,
        ),
      ],
    );
  }
}
