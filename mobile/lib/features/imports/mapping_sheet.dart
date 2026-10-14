import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/overlays.dart';
import '../../models/pending.dart';
import 'imports_service.dart';

/// O banco não tem modelo pronto: o usuário diz quais colunas são a data, o valor e a descrição
/// (uma vez só). Retorna o mapeamento salvo, ou nulo se cancelado.
class MappingSheet extends StatefulWidget {
  const MappingSheet({super.key, required this.headers});

  final List<String> headers;

  @override
  State<MappingSheet> createState() => _MappingSheetState();
}

class _MappingSheetState extends State<MappingSheet> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  String? _date;
  String? _amount;
  String? _description;
  String _dateFormat = '%d/%m/%Y';
  String _decimal = 'COMMA';
  bool _debitIsNegative = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<String?> _chooseColumn(String title, String? selected) {
    final colors = context.colors;

    return showModalBottomSheet<String>(
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
            for (final header in widget.headers)
              ListTile(
                title: Text(header),
                trailing: header == selected ? Icon(LucideIcons.check, size: 16, color: colors.income) : null,
                onTap: () => Navigator.pop(context, header),
              ),
          ],
        ),
      ),
    );
  }

  Widget _column(String label, String? value, ValueChanged<String> onChanged) => LabeledField(
        label: label,
        child: PickerField(
          value: value,
          placeholder: 'Selecione a coluna',
          onTap: () async {
            final selected = await _chooseColumn(label, value);

            if (selected != null) onChanged(selected);
          },
        ),
      );

  Future<void> _submit() async {
    final columns = {_date, _amount, _description};

    if (!_formKey.currentState!.validate() || columns.contains(null) || columns.length != 3) {
      setState(() => _error = 'Escolha uma coluna diferente para data, valor e descrição.');
      return;
    }

    final navigator = Navigator.of(context);

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final mapping = await ImportsService.saveMapping(
        name: _name.text.trim(),
        dateColumn: _date!,
        amountColumn: _amount!,
        descriptionColumn: _description!,
        dateFormat: _dateFormat,
        decimalSeparator: _decimal,
        debitIsNegative: _debitIsNegative,
      );

      navigator.pop<CsvMapping>(mapping);
    } on ApiException catch (error) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = error.message;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return FormSheet(
      icon: LucideIcons.columns3,
      iconBackground: colors.muted,
      iconColor: colors.foreground,
      title: 'Mapear colunas do CSV',
      description: 'Não reconhecemos o modelo deste banco. O mapeamento fica salvo para os próximos envios.',
      formKey: _formKey,
      submitLabel: 'Salvar e importar',
      loading: _loading,
      onSubmit: _submit,
      children: [
        AppTextField(
          label: 'Nome do mapeamento',
          controller: _name,
          placeholder: 'Ex.: Meu banco (extrato)',
          validator: (value) => (value ?? '').trim().isEmpty ? 'Informe um nome' : null,
        ),
        _column('Coluna da data', _date, (value) => setState(() => _date = value)),
        _column('Coluna do valor', _amount, (value) => setState(() => _amount = value)),
        _column('Coluna da descrição', _description, (value) => setState(() => _description = value)),
        LabeledField(
          label: 'Formato da data',
          child: SegmentedControl<String>(
            options: const [
              SegmentOption('%d/%m/%Y', 'dd/mm/aaaa'),
              SegmentOption('%Y-%m-%d', 'aaaa-mm-dd'),
              SegmentOption('%d-%m-%Y', 'dd-mm-aaaa'),
            ],
            value: _dateFormat,
            fontSize: 12,
            onChanged: (value) => setState(() => _dateFormat = value),
          ),
        ),
        LabeledField(
          label: 'Formato do valor',
          child: SegmentedControl<String>(
            options: const [SegmentOption('COMMA', '1.234,56'), SegmentOption('DOT', '1,234.56')],
            value: _decimal,
            onChanged: (value) => setState(() => _decimal = value),
          ),
        ),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text('Os débitos (gastos) aparecem com valor negativo', style: TextStyle(fontSize: 14)),
          value: _debitIsNegative,
          onChanged: (value) => setState(() => _debitIsNegative = value),
        ),
        if (_error != null) Text(_error!, style: TextStyle(color: colors.destructive, fontSize: 13)),
      ],
    );
  }
}
