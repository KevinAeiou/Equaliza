import 'parsing.dart';

/// Saldo de um membro no mês do acerto (valores acumulados desde o início do acerto de contas).
class SettlementMember {
  const SettlementMember({
    required this.id,
    required this.name,
    required this.isActive,
    required this.paid,
    required this.quota,
    required this.difference,
    required this.previousBalance,
    required this.settled,
    required this.balance,
  });

  factory SettlementMember.fromJson(Map<String, dynamic> json) => SettlementMember(
        id: json['id'] as int,
        name: json['name'] as String,
        isActive: json['is_active'] as bool? ?? true,
        paid: toDouble(json['paid']),
        quota: toDouble(json['quota']),
        difference: toDouble(json['difference']),
        previousBalance: toDouble(json['previous_balance']),
        settled: toDouble(json['settled']),
        balance: toDouble(json['balance']),
      );

  final int id;
  final String name;
  final bool isActive;
  final double paid;
  final double quota;
  final double difference;
  final double previousBalance;
  final double settled;
  final double balance;
}

/// Quem paga quem, e quanto, para zerar os saldos.
class SettlementSuggestion {
  const SettlementSuggestion({
    required this.payer,
    required this.payerName,
    required this.receiver,
    required this.receiverName,
    required this.amount,
  });

  factory SettlementSuggestion.fromJson(Map<String, dynamic> json) => SettlementSuggestion(
        payer: json['payer'] as int,
        payerName: json['payer_name'] as String,
        receiver: json['receiver'] as int,
        receiverName: json['receiver_name'] as String,
        amount: toDouble(json['amount']),
      );

  final int payer;
  final String payerName;
  final int receiver;
  final String receiverName;
  final double amount;
}

class SettlementBalance {
  const SettlementBalance({
    required this.month,
    required this.settlementStart,
    required this.myBalance,
    required this.members,
    required this.suggestions,
  });

  factory SettlementBalance.fromJson(Map<String, dynamic> json) => SettlementBalance(
        month: json['month'] as String,
        settlementStart: json['settlement_start'] as String,
        myBalance: toDouble(json['my_balance']),
        members: [
          for (final item in json['members'] as List) SettlementMember.fromJson(item as Map<String, dynamic>),
        ],
        suggestions: [
          for (final item in json['suggestions'] as List) SettlementSuggestion.fromJson(item as Map<String, dynamic>),
        ],
      );

  /// Mês no formato `AAAA-MM`.
  final String month;
  final String settlementStart;
  final double myBalance;
  final List<SettlementMember> members;
  final List<SettlementSuggestion> suggestions;

  SettlementMember? member(int id) => members.where((item) => item.id == id).firstOrNull;
}

class UserRef {
  const UserRef({required this.id, required this.name});

  factory UserRef.fromJson(Map<String, dynamic> json) =>
      UserRef(id: json['id'] as int, name: json['name'] as String);

  final int id;
  final String name;
}

/// Pagamento registrado (total ou parcial) no histórico.
class Settlement {
  const Settlement({
    required this.id,
    required this.payer,
    required this.receiver,
    required this.amount,
    required this.referenceMonth,
    required this.paidAt,
    required this.note,
    required this.cancelled,
    required this.remainingAfter,
    required this.carriedTo,
  });

  factory Settlement.fromJson(Map<String, dynamic> json) => Settlement(
        id: json['id'] as int,
        payer: UserRef.fromJson(json['payer'] as Map<String, dynamic>),
        receiver: UserRef.fromJson(json['receiver'] as Map<String, dynamic>),
        amount: toDouble(json['amount']),
        referenceMonth: json['reference_month'] as String,
        paidAt: toDay(json['paid_at']),
        note: json['note'] as String? ?? '',
        cancelled: json['status'] == 'CANCELLED',
        remainingAfter: toDouble(json['remaining_after']),
        carriedTo: json['carried_to'] as String?,
      );

  final int id;
  final UserRef payer;
  final UserRef receiver;
  final double amount;
  final String referenceMonth;
  final DateTime paidAt;
  final String note;
  final bool cancelled;
  final double remainingAfter;
  final String? carriedTo;
}
