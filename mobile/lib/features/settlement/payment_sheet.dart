import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/overlays.dart';
import '../../models/settlement.dart';
import 'settlement_months.dart';
import 'settlement_service.dart';

const noteMaxLength = 255;

/// Registro de pagamento (total ou parcial) do usuário a um membro com crédito.
/// Retorna `true` quando o pagamento foi registrado.
class PaymentSheet extends StatefulWidget {
  const PaymentSheet({
    super.key,
    required this.userId,
    required this.month,
    required this.balance,
    this.initialReceiver,
  });

  final int userId;
  final String month;
  final SettlementBalance balance;
  final int? initialReceiver;

  @override
  State<PaymentSheet> createState() => _PaymentSheetState();
}

enum _Mode { total, partial }

class _PaymentSheetState extends State<PaymentSheet> {
  final _formKey = GlobalKey<FormState>();
  final _amount = TextEditingController();
  final _note = TextEditingController();
  late DateTime _date = DateTime.now();
  late int? _receiver;
  _Mode _mode = _Mode.total;
  bool _loading = false;
  Map<String, String> _errors = {};

  double get _debt {
    final balance = widget.balance.member(widget.userId)?.balance ?? 0;

    return balance < 0 ? -balance : 0;
  }

  /// Só quem tem crédito pode receber.
  List<SettlementMember> get _receivers =>
      widget.balance.members.where((item) => item.id != widget.userId && item.balance > 0).toList();

  double get _max {
    final receiver = widget.balance.member(_receiver ?? -1);

    if (receiver == null) return 0;

    return _debt < receiver.balance ? _debt : receiver.balance;
  }

  double get _typed => CurrencyInputFormatter.parse(_amount.text);

  double get _remaining => (_debt - _typed).clamp(0, double.infinity);

  @override
  void initState() {
    super.initState();

    final receivers = _receivers;

    _receiver = receivers.where((item) => item.id == widget.initialReceiver).firstOrNull?.id ??
        receivers.firstOrNull?.id;
    _applyMode(_Mode.total);
  }

  @override
  void dispose() {
    _amount.dispose();
    _note.dispose();
    super.dispose();
  }

  void _applyMode(_Mode mode) {
    _mode = mode;
    _amount.text = mode == _Mode.total && _max > 0 ? formatCurrency(_max) : '';
  }

  String? get _amountError {
    if (_typed <= 0) return 'Informe um valor maior que zero';
    if (_typed > _max + 0.001) return 'O valor máximo é ${formatCurrency(_max)}';

    return null;
  }

  Future<void> _pickReceiver() async {
    final selected = await showModalBottomSheet<int>(
      context: context,
      builder: (context) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.only(bottom: 16),
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Text('Quem recebe', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            ),
            for (final member in _receivers)
              ListTile(
                title: Text(member.name),
                subtitle: Text('A receber ${formatCurrency(member.balance)}'),
                trailing: member.id == _receiver ? Icon(LucideIcons.check, size: 16, color: context.colors.income) : null,
                onTap: () => Navigator.pop(context, member.id),
              ),
          ],
        ),
      ),
    );

    if (selected != null) {
      setState(() {
        _receiver = selected;
        _applyMode(_mode);
      });
    }
  }

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _date,
      initialEntryMode: DatePickerEntryMode.calendarOnly,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );

    if (date != null) setState(() => _date = date);
  }

  Future<void> _submit() async {
    setState(() => _errors = {});

    if (_receiver == null || !_formKey.currentState!.validate()) return;

    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    setState(() => _loading = true);

    try {
      await SettlementService.create(
        receiver: _receiver!,
        amount: _typed,
        month: widget.month,
        paidAt: _date,
        note: _note.text.trim(),
      );

      navigator.pop(true);
      messenger.showSnackBar(const SnackBar(content: Text('Pagamento registrado.')));
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
    final receiver = widget.balance.member(_receiver ?? -1);

    return FormSheet(
      icon: LucideIcons.handCoins,
      iconBackground: colors.incomeSoft,
      iconColor: colors.income,
      title: 'Registrar pagamento',
      description: 'Acerto de ${monthShortLabel(widget.month)}. O app só registra: o dinheiro não é movimentado.',
      formKey: _formKey,
      submitLabel: 'Registrar pagamento',
      loadingLabel: 'Registrando...',
      loading: _loading,
      onSubmit: _submit,
      children: [
        LabeledField(
          label: 'Quem recebe',
          child: PickerField(
            value: receiver?.name,
            placeholder: 'Ninguém tem saldo a receber',
            onTap: _receivers.isEmpty ? null : _pickReceiver,
            errorText: _errors['receiver'],
          ),
        ),
        LabeledField(
          label: 'Quanto pagar',
          child: SegmentedControl<_Mode>(
            value: _mode,
            options: [
              SegmentOption(_Mode.total, 'Total', trailing: _max > 0 ? formatCurrency(_max) : null),
              const SegmentOption(_Mode.partial, 'Parcial'),
            ],
            onChanged: (mode) => setState(() => _applyMode(mode)),
          ),
        ),
        LabeledField(
          label: 'Valor',
          child: TextFormField(
            controller: _amount,
            keyboardType: TextInputType.number,
            inputFormatters: [CurrencyInputFormatter()],
            onChanged: (_) => setState(() {}),
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
        if (_remaining > 0)
          Text.rich(
            TextSpan(
              text: 'Restarão ',
              children: [
                TextSpan(text: formatCurrency(_remaining), style: const TextStyle(fontWeight: FontWeight.w600)),
                TextSpan(text: ', lançados em ${monthShortLabel(shiftMonthKey(widget.month, 1))}.'),
              ],
            ),
            style: TextStyle(fontSize: 14, color: colors.mutedForeground),
          ),
        LabeledField(
          label: 'Data do pagamento',
          child: PickerField(
            icon: LucideIcons.calendar,
            value: formatShortDate(_date),
            onTap: _pickDate,
            showChevron: false,
            errorText: _errors['paid_at'],
          ),
        ),
        LabeledField(
          label: 'Observação (opcional)',
          child: TextFormField(
            controller: _note,
            maxLength: noteMaxLength,
            textCapitalization: TextCapitalization.sentences,
            style: const TextStyle(fontSize: 16),
            decoration: InputDecoration(hintText: 'Ex.: Pix de acerto', errorText: _errors['note']),
          ),
        ),
      ],
    );
  }
}
