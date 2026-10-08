import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/session/app_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/error_view.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/overlays.dart';
import '../../models/settlement.dart';
import 'payment_sheet.dart';
import 'settlement_months.dart';
import 'settlement_service.dart';

enum _Tab { balance, history }

/// Acerto de contas do mês: saldo de cada membro, sugestões, pagamento e histórico.
class SettlementScreen extends StatefulWidget {
  const SettlementScreen({super.key, this.initialMonth, this.initialPayTo});

  /// Mês aberto (`AAAA-MM`); sem ele, o mês atual.
  final String? initialMonth;

  /// Recebedor com o pagamento já aberto (atalho a partir do dashboard).
  final int? initialPayTo;

  @override
  State<SettlementScreen> createState() => _SettlementScreenState();
}

class _SettlementScreenState extends State<SettlementScreen> {
  late String _month = _valid(widget.initialMonth) ? widget.initialMonth! : currentMonthKey();
  SettlementBalance? _balance;
  List<Settlement>? _history;
  ApiException? _error;
  _Tab _tab = _Tab.balance;
  bool _onlyActive = false;
  int _request = 0;
  late int? _pendingPay = widget.initialPayTo;

  static bool _valid(String? month) =>
      month != null && RegExp(r'^\d{4}-(0[1-9]|1[0-2])$').hasMatch(month) && month.compareTo(currentMonthKey()) <= 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final request = ++_request;

    setState(() => _error = null);

    try {
      final results = await Future.wait([
        SettlementService.balance(_month),
        SettlementService.history(_month, cancelled: _onlyActive ? false : null),
      ]);

      if (!mounted || request != _request) return;

      setState(() {
        _balance = results[0] as SettlementBalance;
        _history = results[1] as List<Settlement>;
      });

      if (_pendingPay != null) {
        final receiver = _pendingPay;

        _pendingPay = null;
        _pay(receiver);
      }
    } on ApiException catch (error) {
      if (mounted && request == _request) setState(() => _error = error);
    }
  }

  void _changeMonth(int step) {
    setState(() {
      _month = shiftMonthKey(_month, step);
      _balance = null;
      _history = null;
    });
    _load();
  }

  Future<void> _pay([int? receiver]) async {
    final balance = _balance;

    if (balance == null) return;

    final userId = AppScope.read(context).session.user.id;
    final saved = await showFormSheet<bool>(
      context,
      (_) => PaymentSheet(userId: userId, month: _month, balance: balance, initialReceiver: receiver),
    );

    if (saved == true && mounted) _load();
  }

  Future<void> _cancel(Settlement item) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Estornar este pagamento?',
      description: 'O saldo será recalculado sem ele. O estorno fica registrado no histórico.',
      confirmLabel: 'Estornar',
      icon: LucideIcons.undo2,
    );

    if (!confirmed || !mounted) return;

    try {
      await SettlementService.cancel(item.id);
      if (!mounted) return;
      showMessage(context, 'Pagamento estornado.');
      _load();
    } on ApiException catch (error) {
      if (mounted) showMessage(context, error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null && _balance == null) {
      return ErrorView.failure(onRetry: _load, note: _error!.message);
    }

    final colors = context.colors;
    final user = AppScope.of(context).session.user;
    final balance = _balance;
    final atStart = balance != null && _month.compareTo(balance.settlementStart) <= 0;

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
        children: [
          const ScreenHeader(
            title: 'Acertos',
            subtitle: 'Veja quem deve a quem e registre os pagamentos entre os membros.',
          ),
          const SizedBox(height: 16),
          Container(
            height: 44,
            decoration: BoxDecoration(
              color: colors.card,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: colors.border),
            ),
            child: Row(
              children: [
                IconButton(
                  tooltip: 'Mês anterior',
                  onPressed: atStart ? null : () => _changeMonth(-1),
                  icon: const Icon(LucideIcons.chevronLeft, size: 16),
                ),
                Expanded(
                  child: Text(
                    monthLabel(_month),
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                ),
                IconButton(
                  tooltip: 'Próximo mês',
                  onPressed: _month.compareTo(currentMonthKey()) >= 0 ? null : () => _changeMonth(1),
                  icon: const Icon(LucideIcons.chevronRight, size: 16),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SegmentedControl<_Tab>(
            value: _tab,
            options: const [SegmentOption(_Tab.balance, 'Saldo'), SegmentOption(_Tab.history, 'Histórico')],
            onChanged: (tab) => setState(() => _tab = tab),
          ),
          const SizedBox(height: 16),
          if (balance == null) const Skeleton(height: 120),
          if (balance != null && _tab == _Tab.balance) ..._balanceSection(balance, user.id),
          if (balance != null && _tab == _Tab.history) ..._historySection(user.isAdmin),
        ],
      ),
    );
  }

  List<Widget> _balanceSection(SettlementBalance balance, int userId) {
    final colors = context.colors;
    final mine = balance.myBalance;

    return [
      AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Seu saldo', style: TextStyle(fontSize: 14, color: colors.mutedForeground)),
            const SizedBox(height: 4),
            Text(
              formatCurrency(mine.abs()),
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w600,
                color: mine < 0 ? colors.expenseStrong : (mine > 0 ? colors.income : null),
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
            const SizedBox(height: 4),
            Text(
              mine < 0
                  ? 'Você deve esse valor aos outros membros.'
                  : mine > 0
                      ? 'Esse valor é seu a receber.'
                      : 'Você está em dia.',
              style: TextStyle(fontSize: 14, color: colors.mutedForeground),
            ),
          ],
        ),
      ),
      const SizedBox(height: 16),
      AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const CardTitle(title: 'Para equilibrar', description: 'Quem paga quem para zerar os saldos da família.'),
            const SizedBox(height: 12),
            if (balance.suggestions.isEmpty)
              Text('Nada a acertar. Todos estão quites.', style: TextStyle(fontSize: 14, color: colors.mutedForeground)),
            for (final item in balance.suggestions)
              Container(
                margin: const EdgeInsets.only(top: 8),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(color: colors.muted, borderRadius: BorderRadius.circular(10)),
                child: Row(
                  children: [
                    Expanded(
                      child: Text.rich(
                        TextSpan(
                          text: '${getFirstName(item.payerName)} → ${getFirstName(item.receiverName)} ',
                          children: [
                            TextSpan(
                              text: formatCurrency(item.amount),
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                        style: const TextStyle(fontSize: 14),
                      ),
                    ),
                    if (item.payer == userId)
                      FilledButton(onPressed: () => _pay(item.receiver), child: const Text('Pagar')),
                  ],
                ),
              ),
          ],
        ),
      ),
      const SizedBox(height: 16),
      AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const CardTitle(
              title: 'Saldo por membro',
              description: 'O que sobra do mês anterior aparece como saldo anterior.',
            ),
            for (final member in balance.members) ...[
              const SizedBox(height: 12),
              const RowDivider(),
              const SizedBox(height: 12),
              _MemberTile(member: member),
            ],
          ],
        ),
      ),
    ];
  }

  List<Widget> _historySection(bool canCancel) {
    final colors = context.colors;
    final history = _history;

    return [
      Align(
        alignment: Alignment.centerLeft,
        child: FilterChip(
          label: const Text('Só ativos'),
          selected: _onlyActive,
          onSelected: (value) {
            setState(() {
              _onlyActive = value;
              _history = null;
            });
            _load();
          },
        ),
      ),
      const SizedBox(height: 12),
      if (history == null) const Skeleton(height: 80),
      if (history != null && history.isEmpty)
        const EmptyCard(title: 'Nenhum pagamento registrado.', description: 'Os pagamentos do mês aparecem aqui.'),
      for (final item in history ?? <Settlement>[])
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${getFirstName(item.payer.name)} → ${getFirstName(item.receiver.name)}',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                      ),
                    ),
                    Text(
                      formatCurrency(item.amount),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        decoration: item.cancelled ? TextDecoration.lineThrough : null,
                        color: item.cancelled ? colors.mutedForeground : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  [
                    formatShortDate(item.paidAt),
                    'Ref. ${monthShortLabel(item.referenceMonth)}',
                    if (item.note.isNotEmpty) item.note,
                  ].join(' · '),
                  style: TextStyle(fontSize: 12, color: colors.mutedForeground),
                ),
                if (item.remainingAfter > 0 && item.carriedTo != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      'Restaram ${formatCurrency(item.remainingAfter)}, lançados em ${monthShortLabel(item.carriedTo!)}',
                      style: TextStyle(fontSize: 12, color: colors.mutedForeground),
                    ),
                  ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Pill(
                      label: item.cancelled ? 'Estornado' : 'Ativo',
                      bordered: item.cancelled,
                      background: item.cancelled ? null : colors.muted,
                    ),
                    const Spacer(),
                    if (canCancel && !item.cancelled)
                      TextButton(onPressed: () => _cancel(item), child: const Text('Estornar')),
                  ],
                ),
              ],
            ),
          ),
        ),
    ];
  }
}

class _MemberTile extends StatelessWidget {
  const _MemberTile({required this.member});

  final SettlementMember member;

  Color? _tone(BuildContext context, double value) {
    final colors = context.colors;

    return value > 0 ? colors.income : (value < 0 ? colors.expenseStrong : null);
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    const small = TextStyle(fontSize: 12);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                member.isActive ? member.name : '${member.name} (inativo)',
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
              ),
            ),
            Pill(
              label: formatSignedCurrency(member.balance),
              background: member.balance >= 0 ? colors.incomeSoft : colors.expenseSoft,
              foreground: member.balance >= 0 ? colors.income : colors.expenseStrong,
            ),
          ],
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 16,
          runSpacing: 4,
          children: [
            Text('Pagou ${formatCurrency(member.paid)}', style: small.copyWith(color: colors.mutedForeground)),
            Text('Cota ${formatCurrency(member.quota)}', style: small.copyWith(color: colors.mutedForeground)),
            Text(
              'Anterior ${formatSignedCurrency(member.previousBalance)}',
              style: small.copyWith(color: _tone(context, member.previousBalance) ?? colors.mutedForeground),
            ),
            if (member.settled != 0)
              Text(
                'Acertos ${formatSignedCurrency(member.settled)}',
                style: small.copyWith(color: colors.mutedForeground),
              ),
          ],
        ),
      ],
    );
  }
}
