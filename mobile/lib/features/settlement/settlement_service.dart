import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/utils/period.dart' show toApiDate;
import '../../models/settlement.dart';

abstract final class SettlementService {
  static Future<SettlementBalance> balance(String month) => guard('buscar o saldo do acerto de contas', () async {
        final response = await api.get('settlements/balance/', queryParameters: {'month': month});

        return SettlementBalance.fromJson(response.data as Map<String, dynamic>);
      });

  static Future<List<Settlement>> history(String month, {int? member, bool? cancelled}) =>
      guard('buscar o histórico de acertos', () async {
        final response = await api.get('settlements/', queryParameters: {
          'month': month,
          'member': ?member,
          if (cancelled != null) 'status': cancelled ? 'CANCELLED' : 'ACTIVE',
        });

        return [for (final item in response.data as List) Settlement.fromJson(item as Map<String, dynamic>)];
      });

  static Future<Settlement> create({
    required int receiver,
    required double amount,
    required String month,
    required DateTime paidAt,
    String note = '',
  }) =>
      guard('registrar pagamento', () async {
        final response = await api.post('settlements/', data: {
          'receiver': receiver,
          'amount': amount.toStringAsFixed(2),
          'month': month,
          'paid_at': toApiDate(paidAt),
          'note': note,
        });

        return Settlement.fromJson(response.data as Map<String, dynamic>);
      });

  static Future<void> cancel(int id) => guard('estornar pagamento', () async {
        await api.post('settlements/$id/cancel/');
      });
}
