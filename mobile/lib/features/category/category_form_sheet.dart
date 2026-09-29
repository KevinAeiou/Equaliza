import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/overlays.dart';
import '../../models/finance.dart';
import 'category_service.dart';

/// Cadastro e edição de categoria. Retorna `true` quando salva.
class CategoryFormSheet extends StatefulWidget {
  const CategoryFormSheet({super.key, this.category});

  final Category? category;

  @override
  State<CategoryFormSheet> createState() => _CategoryFormSheetState();
}

class _CategoryFormSheetState extends State<CategoryFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.category?.name);
  late EntryType _type = widget.category?.type ?? EntryType.expense;
  bool _loading = false;
  String? _nameError;

  bool get _editing => widget.category != null;

  // O backend não permite mudar o tipo de uma categoria que já tem lançamentos.
  bool get _typeLocked => _editing && widget.category!.inUse;

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
      await CategoryService.save(id: widget.category?.id, name: _name.text.trim(), type: _type);

      navigator.pop(true);
      messenger.showSnackBar(SnackBar(content: Text(_editing ? 'Categoria atualizada.' : 'Categoria criada.')));
    } on ApiException catch (error) {
      if (!mounted) return;

      setState(() {
        _loading = false;
        _nameError = error.fieldErrors['name'];
      });

      if (_nameError == null) showMessage(context, error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return FormSheet(
      icon: LucideIcons.tag,
      iconBackground: colors.muted,
      iconColor: colors.foreground,
      title: _editing ? 'Editar categoria' : 'Nova categoria',
      description: 'Categorias organizam as receitas e despesas da família.',
      formKey: _formKey,
      submitLabel: _editing ? 'Salvar alterações' : 'Criar categoria',
      loading: _loading,
      onSubmit: _submit,
      children: [
        AppTextField(
          label: 'Nome',
          controller: _name,
          placeholder: 'Ex.: Pets',
          textCapitalization: TextCapitalization.sentences,
          textInputAction: TextInputAction.done,
          errorText: _nameError,
          validator: (value) => requiredMin(value, 3, 'Informe o nome da categoria'),
        ),
        LabeledField(
          label: 'Tipo',
          hint: _typeLocked ? 'O tipo não pode ser alterado porque a categoria já tem lançamentos.' : null,
          child: SegmentedControl(
            enabled: !_typeLocked,
            options: const [
              SegmentOption(EntryType.expense, 'Despesa'),
              SegmentOption(EntryType.income, 'Receita'),
            ],
            value: _type,
            onChanged: (type) => setState(() => _type = type),
          ),
        ),
      ],
    );
  }
}
