import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/overlays.dart';
import '../../models/user.dart';
import 'family_service.dart';

enum FamilyResult { saved, delete }

/// Criação ou renomeação de família. Retorna [FamilyResult], ou nulo se cancelado.
class FamilyFormSheet extends StatefulWidget {
  const FamilyFormSheet({super.key, this.family});

  final Family? family;

  @override
  State<FamilyFormSheet> createState() => _FamilyFormSheetState();
}

class _FamilyFormSheetState extends State<FamilyFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.family?.name);
  bool _loading = false;
  String? _nameError;

  bool get _editing => widget.family != null;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _nameError = null);

    if (!_formKey.currentState!.validate()) return;

    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    setState(() => _loading = true);

    try {
      await FamilyService.save(id: widget.family?.id, name: _name.text.trim());

      navigator.pop(FamilyResult.saved);
      messenger.showSnackBar(SnackBar(content: Text(_editing ? 'Família renomeada.' : 'Família criada.')));
    } on ApiException catch (error) {
      if (!mounted) return;

      setState(() {
        _loading = false;
        _nameError = error.fieldErrors['name'] ?? error.message;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final createdAt = widget.family?.createdAt;

    return FormSheet(
      icon: LucideIcons.usersRound,
      iconBackground: colors.incomeSoft,
      iconColor: colors.income,
      title: _editing ? 'Renomear família' : 'Nova família',
      description: _editing
          ? 'O novo nome aparece para todos os membros.'
          : 'Depois de criar a família, você poderá convidar pessoas para dividir as finanças.',
      formKey: _formKey,
      submitLabel: _editing ? 'Salvar alterações' : 'Criar família',
      loading: _loading,
      onSubmit: _submit,
      children: [
        AppTextField(
          label: 'Nome da família',
          controller: _name,
          placeholder: 'Ex.: Família Silva',
          textCapitalization: TextCapitalization.words,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _submit(),
          errorText: _nameError,
          validator: (value) => requiredMin(value, 3, 'Informe o nome da família'),
        ),
        if (createdAt != null)
          Text(
            'Criada em ${formatDateTime(createdAt)}',
            style: TextStyle(fontSize: 12, color: colors.mutedForeground),
          ),
        if (_editing)
          OutlinedButton.icon(
            onPressed: _loading ? null : () => Navigator.pop(context, FamilyResult.delete),
            style: OutlinedButton.styleFrom(
              foregroundColor: colors.destructive,
              side: BorderSide(color: colors.destructive.withValues(alpha: 0.4)),
            ),
            icon: const Icon(LucideIcons.trash2, size: 16),
            label: const Text('Excluir família'),
          ),
      ],
    );
  }
}
