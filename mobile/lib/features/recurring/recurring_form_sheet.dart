import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/overlays.dart';
import '../../models/finance.dart';
import '../../models/recurring.dart';
import '../finance/finance_form_sheet.dart' show descriptionMaxLength;
import 'recurring_service.dart';

enum RecurringResult { saved, delete }

/// Cadastro e edição de recorrente. Retorna [RecurringResult], ou nulo se cancelado.
class RecurringFormSheet extends StatefulWidget {
  const RecurringFormSheet({super.key, required this.categories, this.recurring});

  final List<Category> categories;
  final Recurring? recurring;

  @override
  State<RecurringFormSheet> createState() => _RecurringFormSheetState();
}

class _RecurringFormSheetState extends State<RecurringFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final _amount = TextEditingController(
    text: widget.recurring == null ? '' : formatCurrency(widget.recurring!.amount),
  );
  late final _description = TextEditingController(text: widget.recurring?.description ?? '');
  late EntryType _type = widget.recurring?.type ?? EntryType.expense;
  late RecurrenceFrequency _frequency = widget.recurring?.frequency ?? RecurrenceFrequency.monthly;
  late DateTime _startDate = widget.recurring?.startDate ?? DateTime.now();
  late DateTime? _endDate = widget.recurring?.endDate;
  late bool _hasEnd = widget.recurring?.endDate != null;
  late bool _isActive = widget.recurring?.isActive ?? true;
  late int? _category = widget.recurring?.category.id;

  bool _loading = false;
  bool _submitted = false;
  Map<String, String> _errors = {};

  bool get _editing => widget.recurring != null;

  List<Category> get _typeCategories => widget.categories.where((category) => category.type == _type).toList();

  @override
  void dispose() {
    _amount.dispose();
    _description.dispose();
    super.dispose();
  }

  DateTime _initialEnd() => _endDate ?? (_startDate.isAfter(DateTime.now()) ? _startDate : DateTime.now());

  /// Ao fechar um seletor o Flutter devolve o foco ao último campo de texto; aqui ele é descartado.
  void _clearFocus() {
    FocusManager.instance.primaryFocus?.unfocus();

    // A restauração do foco acontece após a transição da rota, então é refeita no quadro seguinte.
    WidgetsBinding.instance.addPostFrameCallback((_) => FocusManager.instance.primaryFocus?.unfocus());
  }

  Future<DateTime?> _pickDate(DateTime initial) async {
    _clearFocus();

    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      // O modo de digitação do Flutter não tem máscara e aceita qualquer sequência de números.
      initialEntryMode: DatePickerEntryMode.calendarOnly,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );

    _clearFocus();

    return date;
  }

  Future<void> _pickStart() async {
    final date = await _pickDate(_startDate);

    if (date != null) setState(() => _startDate = date);
  }

  Future<void> _pickEnd() async {
    final date = await _pickDate(_initialEnd());

    if (date != null) setState(() => _endDate = date);
  }

  // Trocar o tipo invalida a categoria escolhida.
  void _setType(EntryType type) => setState(() {
        _type = type;
        _category = null;
      });

  Future<void> _pickCategory() async {
    _clearFocus();

    final colors = context.colors;
    final categories = _typeCategories;

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
            if (categories.isEmpty)
              Padding(
                padding: const EdgeInsets.all(20),
                child: Text(
                  'Nenhuma categoria de ${_type.plural.toLowerCase()} cadastrada.',
                  style: TextStyle(color: colors.mutedForeground),
                ),
              ),
            for (final category in categories)
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

  String? get _endError {
    if (!_hasEnd) return null;
    if (_endDate == null) return 'Informe a data final.';
    if (_endDate!.isBefore(_startDate)) return 'A data final não pode ser anterior à data de início.';

    return null;
  }

  Future<void> _submit() async {
    setState(() {
      _submitted = true;
      _errors = {};
    });

    if (!_formKey.currentState!.validate() || _category == null || _endError != null) return;

    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    final amount = CurrencyInputFormatter.parse(_amount.text);
    final endDate = _hasEnd ? _endDate : null;
    final description = _description.text.trim();

    setState(() => _loading = true);

    try {
      if (_editing) {
        await RecurringService.update(
          widget.recurring!.id,
          amount: amount,
          category: _category!,
          endDate: endDate,
          description: description,
          isActive: _isActive,
        );
      } else {
        await RecurringService.create(
          type: _type,
          amount: amount,
          category: _category!,
          frequency: _frequency,
          startDate: _startDate,
          endDate: endDate,
          description: description,
        );
      }

      navigator.pop(RecurringResult.saved);
      messenger.showSnackBar(SnackBar(content: Text(_editing ? 'Recorrente atualizada.' : 'Recorrente criada.')));
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
    final expense = _type == EntryType.expense;
    final tipo = _type.singular;
    final recurring = widget.recurring;
    final categoryName = _typeCategories.where((category) => category.id == _category).firstOrNull?.name ??
        (_type == recurring?.type ? recurring?.category.name : null);

    return FormSheet(
      icon: _editing ? LucideIcons.repeat : (expense ? LucideIcons.arrowDownRight : LucideIcons.arrowUpRight),
      iconBackground: expense ? colors.expenseSoft : colors.incomeSoft,
      iconColor: expense ? colors.expenseStrong : colors.income,
      title: _editing ? 'Editar recorrente' : 'Nova $tipo recorrente',
      description: _editing
          ? 'Mudanças valem para os próximos lançamentos. Os já criados não são alterados.'
          : 'Defina uma vez. O lançamento é criado sozinho a cada ciclo.',
      formKey: _formKey,
      submitLabel: _editing ? 'Salvar alterações' : 'Criar $tipo recorrente',
      loading: _loading,
      onSubmit: _submit,
      children: [
        if (!_editing)
          SegmentedControl(
            options: [for (final type in EntryType.values.reversed) SegmentOption(type, capitalize(type.singular))],
            value: _type,
            onChanged: _setType,
          ),
        LabeledField(
          label: 'Valor',
          child: TextFormField(
            controller: _amount,
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
        if (!_editing)
          LabeledField(
            label: 'Repetir',
            child: SegmentedControl(
              options: [for (final frequency in RecurrenceFrequency.values) SegmentOption(frequency, frequency.label)],
              value: _frequency,
              onChanged: (frequency) => setState(() => _frequency = frequency),
            ),
          ),
        LabeledField(
          label: _editing ? 'Início' : 'Primeira ocorrência',
          child: PickerField(
            icon: LucideIcons.calendar,
            value: formatShortDate(_startDate),
            onTap: _editing ? null : _pickStart,
            showChevron: false,
            errorText: _errors['start_date'],
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
          label: 'Término',
          child: SegmentedControl(
            options: const [SegmentOption(false, 'Sem data final'), SegmentOption(true, 'Até uma data')],
            value: _hasEnd,
            onChanged: (value) => setState(() {
              _hasEnd = value;
              if (value) _endDate ??= _initialEnd();
            }),
          ),
        ),
        if (_hasEnd)
          LabeledField(
            label: 'Data final',
            child: PickerField(
              icon: LucideIcons.calendar,
              value: _endDate == null ? null : formatShortDate(_endDate!),
              onTap: _pickEnd,
              showChevron: false,
              errorText: _errors['end_date'] ?? (_submitted ? _endError : null),
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
              hintText: expense ? 'Ex.: Aluguel do apartamento' : 'Ex.: Salário mensal',
              errorText: _errors['description'],
            ),
          ),
        ),
        if (_editing)
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Recorrente ativa', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                    Text(
                      'Pause para interromper novos lançamentos.',
                      style: TextStyle(fontSize: 12, color: colors.mutedForeground),
                    ),
                  ],
                ),
              ),
              Switch(value: _isActive, onChanged: (value) => setState(() => _isActive = value)),
            ],
          ),
        if (recurring != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: colors.muted, borderRadius: BorderRadius.circular(10)),
            child: Text(
              '${recurring.isActive ? 'Próximo lançamento em ${formatDayMonthYear(recurring.nextDate)}, ' : 'Pausada. Quando ativa, será lançada '}'
              '${describeSchedule(recurring.frequency, recurring.startDate).toLowerCase()}.',
              style: const TextStyle(fontSize: 14),
            ),
          ),
          OutlinedButton.icon(
            onPressed: _loading ? null : () => Navigator.pop(context, RecurringResult.delete),
            style: OutlinedButton.styleFrom(
              foregroundColor: colors.destructive,
              side: BorderSide(color: colors.destructive.withValues(alpha: 0.4)),
            ),
            icon: const Icon(LucideIcons.trash2, size: 16),
            label: const Text('Excluir recorrente'),
          ),
        ],
      ],
    );
  }
}
