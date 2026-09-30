import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/utils/period.dart';
import '../../models/finance.dart';
import '../../models/recurring.dart';

abstract final class RecurringService {
  static Future<List<Recurring>> list() => guard('listar recorrentes', () async {
        final response = await api.get('finances/recurring/');

        return (response.data as List).map((item) => Recurring.fromJson(item as Map<String, dynamic>)).toList();
      });

  static Future<void> create({
    required EntryType type,
    required double amount,
    required int category,
    required RecurrenceFrequency frequency,
    required DateTime startDate,
    DateTime? endDate,
    String? description,
  }) =>
      guard('criar recorrente', () async {
        await api.post('finances/recurring/', data: {
          'type': type.value,
          'amount': amount,
          'description': description ?? '',
          'category': category,
          'frequency': frequency.value,
          'start_date': toApiDate(startDate),
          'end_date': endDate == null ? null : toApiDate(endDate),
        });
      });

  /// A API só altera valor, categoria, observação, data final e situação.
  static Future<void> update(
    int id, {
    required double amount,
    required int category,
    required bool isActive,
    DateTime? endDate,
    String? description,
  }) =>
      guard('atualizar recorrente', () async {
        await api.put('finances/recurring/$id/', data: {
          'amount': amount,
          'description': description ?? '',
          'category': category,
          'end_date': endDate == null ? null : toApiDate(endDate),
          'is_active': isActive,
        });
      });

  static Future<void> setActive(Recurring recurring, bool isActive) => update(
        recurring.id,
        amount: recurring.amount,
        category: recurring.category.id,
        endDate: recurring.endDate,
        description: recurring.description,
        isActive: isActive,
      );

  static Future<void> delete(int id) => guard('excluir recorrente', () async {
        await api.delete('finances/recurring/$id/');
      });
}
