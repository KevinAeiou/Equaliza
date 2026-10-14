import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/session/app_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/overlays.dart';
import '../../models/finance.dart';
import '../../models/pending.dart';
import '../finance/finance_form_sheet.dart' show descriptionMaxLength;
import 'imports_service.dart';

/// Registra uma pendência como despesa (valor, data e descrição pré-preenchidos e editáveis) ou
/// várias de uma vez (só família e categoria). Retorna `true` quando registrou.
class RegisterPendingSheet extends StatefulWidget {
  const RegisterPendingSheet({super.key, required this.categories, this.pending, this.ids = const []});

  final List<Category> categories;
  final PendingTransaction? pending;
  final List<int> ids;

  @override
  State<RegisterPendingSheet> createState() => _RegisterPendingSheetState();
}

class _RegisterPendingSheetState extends State<RegisterPendingSheet> {
  final _formKey = GlobalKey<FormState>();
  late final _amount = TextEditingController(text: bulk ? '' : formatCurrency(widget.pending!.amount));
  late final _description = TextEditingController(text: widget.pending?.description ?? '');
  late DateTime _date = widget.pending?.date ?? DateTime.now();
  int? _category;
  int? _family;
  bool _loading = false;
  bool _submitted = false;
  Map<String, String> _errors = {};

  bool get bulk => widget.pending == null;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _family ??= AppScope.read(context).session.user.currentFamily?.id;
  }

  @override
  void dispose() {
    _amount.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<int?> _choose(String title, List<({int id, String name})> options, int? selected) {
    final colors = context.colors;

    return showModalBottomSheet<int>(
      context: context,
      builder: (context) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.only(bottom: 16),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            ),
            for (final option in options)
              ListTile(
                title: Text(option.name),
                trailing: option.id == selected ? Icon(LucideIcons.check, size: 16, color: colors.income) : null,
                onTap: () => Navigator.pop(context, option.id),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _date,
      initialEntryMode: DatePickerEntryMode.calendarOnly,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );

    if (date != null) setState(() => _date = date);
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

    if ((!bulk && !_formKey.currentState!.validate()) || _category == null || _family == null) return;

    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    setState(() => _loading = true);

    try {
      if (bulk) {
        final processed = await ImportsService.bulk(widget.ids, register: true, family: _family, category: _category);
        messenger.showSnackBar(SnackBar(content: Text('$processed despesa(s) registrada(s).')));
      } else {
        await ImportsService.register(
          widget.pending!.id,
          family: _family!,
          category: _category!,
          amount: CurrencyInputFormatter.parse(_amount.text),
          date: _date,
          description: _description.text.trim(),
        );
        messenger.showSnackBar(const SnackBar(content: Text('Despesa registrada.')));
      }

      navigator.pop(true);
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
    final families = AppScope.of(context).session.user.families;
    final categoryName = widget.categories.where((category) => category.id == _category).firstOrNull?.name;
    final familyName = families.where((family) => family.id == _family).firstOrNull?.name;

    return FormSheet(
      icon: LucideIcons.arrowDownRight,
      iconBackground: colors.expenseSoft,
      iconColor: colors.expenseStrong,
      title: bulk ? 'Registrar ${widget.ids.length} despesas' : 'Registrar como despesa',
      description: bulk
          ? 'Todas as selecionadas usam a mesma família e categoria. Cada despesa pode ser editada depois.'
          : 'Confira os dados do extrato antes de registrar.',
      formKey: _formKey,
      submitLabel: bulk ? 'Registrar despesas' : 'Registrar despesa',
      loading: _loading,
      onSubmit: _submit,
      children: [
        if (!bulk) ...[
          LabeledField(
            label: 'Valor',
            child: TextFormField(
              controller: _amount,
              keyboardType: TextInputType.number,
              inputFormatters: [CurrencyInputFormatter()],
              validator: (_) => _amountError,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w600, fontFeatures: [FontFeature.tabularFigures()]),
              decoration: InputDecoration(errorText: _errors['amount']),
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
        ],
        LabeledField(
          label: 'Categoria',
          child: PickerField(
            value: categoryName,
            onTap: () async {
              final selected = await _choose(
                'Categoria',
                [for (final category in widget.categories) (id: category.id, name: category.name)],
                _category,
              );

              if (selected != null) setState(() => _category = selected);
            },
            errorText: _errors['category'] ?? (_submitted && _category == null ? 'Selecione uma categoria' : null),
          ),
        ),
        if (families.length > 1)
          LabeledField(
            label: 'Família',
            child: PickerField(
              value: familyName,
              onTap: () async {
                final selected = await _choose(
                  'Família',
                  [for (final family in families) (id: family.id, name: family.name)],
                  _family,
                );

                if (selected != null) setState(() => _family = selected);
              },
              errorText: _errors['family'],
            ),
          ),
        if (!bulk)
          LabeledField(
            label: 'Descrição (opcional)',
            child: TextFormField(
              controller: _description,
              minLines: 2,
              maxLines: 4,
              maxLength: descriptionMaxLength,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(errorText: _errors['description']),
            ),
          ),
        Text(
          'Os membros da família verão o valor, a data e a descrição.'
          '${families.length > 1 ? ' Categorias personalizadas só valem na família ativa.' : ''}',
          style: TextStyle(fontSize: 12, color: colors.mutedForeground),
        ),
      ],
    );
  }
}
