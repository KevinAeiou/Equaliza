import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/utils/period.dart';
import '../../models/finance.dart';

abstract final class FinanceService {
  static Future<List<FinanceEntry>> list(EntryType type, PeriodFilters filters) =>
      guard('listar ${type.plural.toLowerCase()}', () async {
        final response = await api.get('finances/${type.endpoint}', queryParameters: filters.toQuery());

        return (response.data as List)
            .map((item) => FinanceEntry.fromJson(item as Map<String, dynamic>, type))
            .toList();
      });

  static Future<void> save(
    EntryType type, {
    int? id,
    required double amount,
    required DateTime date,
    required int category,
    String? description,
  }) =>
      guard(id == null ? 'criar ${type.singular}' : 'atualizar ${type.singular}', () async {
        final data = {
          'amount': amount,
          'date': toApiDate(date),
          'category': category,
          'description': description ?? '',
        };

        if (id == null) {
          await api.post('finances/${type.endpoint}', data: data);
        } else {
          await api.put('finances/${type.endpoint}$id/', data: data);
        }
      });

  static Future<void> delete(EntryType type, int id) => guard('excluir ${type.singular}', () async {
        await api.delete('finances/${type.endpoint}$id/');
      });
}
