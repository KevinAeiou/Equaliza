import 'dart:io';

import 'package:dio/dio.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

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

  /// Baixa o CSV ou PDF dos lançamentos filtrados e abre a folha de compartilhamento.
  static Future<void> export(EntryType type, PeriodFilters filters, String exportFormat) =>
      guard('exportar ${type.plural.toLowerCase()}', () async {
        final response = await api.get<List<int>>(
          'finances/${type.endpoint}export/',
          queryParameters: {...filters.toQuery(), 'export_format': exportFormat},
          options: Options(responseType: ResponseType.bytes),
        );

        final directory = await getTemporaryDirectory();
        final name = '${type.plural.toLowerCase()}-${DateFormat('yyyy-MM-dd').format(DateTime.now())}.$exportFormat';
        final file = File('${directory.path}/$name');
        await file.writeAsBytes(response.data!, flush: true);

        await SharePlus.instance.share(ShareParams(files: [XFile(file.path)]));
      });

  static Future<List<FinanceMember>> members() => guard('listar membros', () async {
        final response = await api.get('finances/members/');

        return (response.data as List)
            .map((item) => FinanceMember.fromJson(item as Map<String, dynamic>))
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
