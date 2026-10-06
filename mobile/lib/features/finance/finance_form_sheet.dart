import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/overlays.dart';
import '../../models/finance.dart';
import 'finance_service.dart';

const descriptionMaxLength = 1000;

enum FinanceResult { saved, delete }

/// Cadastro e edição de receita ou despesa. Retorna [FinanceResult], ou nulo se cancelado.
class FinanceFormSheet extends StatefulWidget {
  const FinanceFormSheet({
    super.key,
    required this.type,
    required this.categories,
    this.entry,
    this.initialDate,
  });

  final EntryType type;
  final List<Category> categories;
  final FinanceEntry? entry;

  /// Data sugerida em um novo lançamento (início do período filtrado). Ignorada ao editar.
  final DateTime? initialDate;

  @override
  State<FinanceFormSheet> createState() => _FinanceFormSheetState();
}

class _FinanceFormSheetState extends State<FinanceFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final _amount = TextEditingController(
    text: widget.entry == null ? '' : formatCurrency(widget.entry!.amount),
  );
  late final _description = TextEditingController(text: widget.entry?.description ?? '');
  final _amountFocus = FocusNode();
  late DateTime _date = widget.entry?.date ?? widget.initialDate ?? DateTime.now();
  late int? _category = widget.entry?.category.id;

  bool _loading = false;
  bool _submitted = false;
  Map<String, String> _errors = {};

  bool get _editing => widget.entry != null;

  @override
  void dispose() {
    _amount.dispose();
    _amountFocus.dispose();
    _description.dispose();
    super.dispose();
  }

  /// Ao fechar um seletor o Flutter devolve o foco ao último campo de texto; aqui ele é descartado.
  void _clearFocus() {
    FocusManager.instance.primaryFocus?.unfocus();

    // A restauração do foco acontece após a transição da rota, então é refeita no quadro seguinte.
    WidgetsBinding.instance.addPostFrameCallback((_) => FocusManager.instance.primaryFocus?.unfocus());
  }

  Future<void> _pickDate() async {
    _clearFocus();

    final date = await showDatePicker(
      context: context,
      initialDate: _date,
      // O modo de digitação do Flutter não tem máscara e aceita qualquer sequência de números.
      initialEntryMode: DatePickerEntryMode.calendarOnly,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );

    _clearFocus();

    if (date != null) setState(() => _date = date);
  }

  Future<void> _pickCategory() async {
    _clearFocus();

    final colors = context.colors;

    final selected = await showModalBottomSheet<int>(
      context: context,
      builder: (context) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.only(bottom: 16),
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Text('Categoria', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            ),
            if (widget.categories.isEmpty)
              Padding(
                padding: const EdgeInsets.all(20),
                child: Text(
                  'Nenhuma categoria de ${widget.type.plural.toLowerCase()} cadastrada.',
                  style: TextStyle(color: colors.mutedForeground),
                ),
              ),
            for (final category in widget.categories)
              ListTile(
                title: Text(category.name),
                trailing: category.id == _category ? Icon(LucideIcons.check, size: 16, color: colors.income) : null,
                onTap: () => Navigator.pop(context, category.id),
              ),
          ],
        ),
      ),
    );

    _clearFocus();

    if (selected != null) setState(() => _category = selected);
  }

  String? get _amountError {
    final amount = CurrencyInputFormatter.parse(_amount.text);

    if (amount <= 0) return 'Informe um valor maior que zero';
    if (amount > 1000000) return 'O valor máximo permitido é R\$ 1.000.000,00';

    return null;
  }

  Future<void> _submit() async {
    setState(() {
      _submitted = true;
      _errors = {};
    });

    if (!_formKey.currentState!.validate() || _category == null) {
      if (_amountError != null) _amountFocus.requestFocus();
      return;
    }

    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    setState(() => _loading = true);

    try {
      await FinanceService.save(
        widget.type,
        id: widget.entry?.id,
        amount: CurrencyInputFormatter.parse(_amount.text),
        date: _date,
        category: _category!,
        description: _description.text.trim(),
      );

      navigator.pop(FinanceResult.saved);
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            _editing
                ? '${capitalize(widget.type.singular)} atualizada.'
                : '${capitalize(widget.type.singular)} registrada.',
          ),
        ),
      );
    } on ApiException catch (error) {
      if (!mounted) return;

      setState(() {
        _loading = false;
        _errors = error.fieldErrors;
      });

      if (error.fieldErrors.isEmpty) showMessage(context, error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final expense = widget.type == EntryType.expense;
    final categoryName = widget.categories.where((category) => category.id == _category).firstOrNull?.name ??
        widget.entry?.category.name;
    final entry = widget.entry;

    return FormSheet(
      icon: expense ? LucideIcons.arrowDownRight : LucideIcons.arrowUpRight,
      iconBackground: expense ? colors.expenseSoft : colors.incomeSoft,
      iconColor: expense ? colors.expenseStrong : colors.income,
      title: _editing ? 'Editar ${widget.type.singular}' : 'Nova ${widget.type.singular}',
      description: expense
          ? 'Registre um gasto da família. Ele entra na divisão entre os membros.'
          : 'Registre um valor recebido. Ele define a cota de cada membro nas despesas.',
      formKey: _formKey,
      submitLabel: _editing ? 'Salvar alterações' : 'Registrar ${widget.type.singular}',
      loading: _loading,
      onSubmit: _submit,
      children: [
        LabeledField(
          label: 'Valor',
          child: TextFormField(
            controller: _amount,
            focusNode: _amountFocus,
            keyboardType: TextInputType.number,
            inputFormatters: [CurrencyInputFormatter()],
            validator: (_) => _amountError,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w600, fontFeatures: [FontFeature.tabularFigures()]),
            decoration: InputDecoration(
              hintText: 'R\$ 0,00',
              errorText: _errors['amount'],
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              hintStyle: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: colors.mutedForeground),
            ),
          ),
        ),
        LabeledField(
          label: 'Data',
          child: PickerField(
            icon: LucideIcons.calendar,
            value: formatShortDate(_date),
            onTap: _pickDate,
            showChevron: false,
            errorText: _errors['date'],
          ),
        ),
        LabeledField(
          label: 'Categoria',
          child: PickerField(
            value: categoryName,
            onTap: _pickCategory,
            errorText: _errors['category'] ?? (_submitted && _category == null ? 'Selecione uma categoria' : null),
          ),
        ),
        LabeledField(
          label: 'Observação (opcional)',
          child: TextFormField(
            controller: _description,
            minLines: 3,
            maxLines: 5,
            maxLength: descriptionMaxLength,
            textCapitalization: TextCapitalization.sentences,
            style: const TextStyle(fontSize: 16),
            decoration: InputDecoration(
              hintText: expense ? 'Ex.: Compras do mês no mercado' : 'Ex.: Salário de setembro',
              errorText: _errors['description'],
            ),
          ),
        ),
        if (entry?.createdAt != null)
          Text(
            [
              'Criada em ${formatDateTime(entry!.createdAt!)}',
              if (entry.updatedAt != null && entry.updatedAt != entry.createdAt)
                'atualizada em ${formatDateTime(entry.updatedAt!)}',
            ].join(' · '),
            style: TextStyle(fontSize: 12, color: colors.mutedForeground),
          ),
        if (_editing)
          OutlinedButton.icon(
            onPressed: _loading ? null : () => Navigator.pop(context, FinanceResult.delete),
            style: OutlinedButton.styleFrom(
              foregroundColor: colors.destructive,
              side: BorderSide(color: colors.destructive.withValues(alpha: 0.4)),
            ),
            icon: const Icon(LucideIcons.trash2, size: 16),
            label: Text('Excluir ${widget.type.singular}'),
          ),
      ],
    );
  }
}
