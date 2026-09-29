import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/session/app_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/brand.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/overlays.dart';

class ProfileSheet extends StatefulWidget {
  const ProfileSheet({super.key});

  @override
  State<ProfileSheet> createState() => _ProfileSheetState();
}

class _ProfileSheetState extends State<ProfileSheet> {
  final _formKey = GlobalKey<FormState>();
  late final _user = AppScope.read(context).session.user;
  late final _firstName = TextEditingController(text: _user.firstName);
  late final _lastName = TextEditingController(text: _user.lastName);
  late String _avatar = _user.avatarId ?? avatarIds.first;
  bool _loading = false;

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    setState(() => _loading = true);

    try {
      await AppScope.read(context).session.updateProfile(
            firstName: _firstName.text.trim(),
            lastName: _lastName.text.trim(),
            avatar: _avatar,
          );

      navigator.pop();
      messenger.showSnackBar(const SnackBar(content: Text('Perfil atualizado.')));
    } on ApiException catch (error) {
      if (mounted) {
        setState(() => _loading = false);
        showMessage(context, error.message);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return FormSheet(
      icon: LucideIcons.userRound,
      iconBackground: colors.muted,
      iconColor: colors.foreground,
      title: 'Editar perfil',
      description: 'Seu nome e avatar aparecem para os membros das suas famílias.',
      formKey: _formKey,
      submitLabel: 'Salvar alterações',
      loading: _loading,
      onSubmit: _submit,
      children: [
        LabeledField(
          label: 'Avatar',
          child: GridView.count(
            crossAxisCount: 4,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            children: [
              for (final (index, id) in avatarIds.indexed)
                Semantics(
                  label: 'Avatar ${index + 1}',
                  selected: id == _avatar,
                  button: true,
                  child: GestureDetector(
                    onTap: () => setState(() => _avatar = id),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: id == _avatar ? colors.brand : Colors.transparent, width: 2),
                        boxShadow: id == _avatar
                            ? [BoxShadow(color: colors.brand.withValues(alpha: 0.25), spreadRadius: 2)]
                            : null,
                      ),
                      child: ClipOval(child: Image.asset('assets/avatars/$id.jpg', fit: BoxFit.cover)),
                    ),
                  ),
                ),
            ],
          ),
        ),
        AppTextField(
          label: 'Nome',
          controller: _firstName,
          placeholder: 'Seu nome',
          textCapitalization: TextCapitalization.words,
          validator: (value) => requiredMin(value, 2, 'O nome deve possuir pelo menos 2 caracteres'),
        ),
        AppTextField(
          label: 'Sobrenome',
          controller: _lastName,
          placeholder: 'Seu sobrenome',
          textCapitalization: TextCapitalization.words,
          textInputAction: TextInputAction.done,
          validator: (value) => requiredMin(value, 3, 'Informe seu sobrenome'),
        ),
      ],
    );
  }
}
