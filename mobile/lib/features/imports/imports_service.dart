import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/utils/period.dart';
import '../../models/pending.dart';

/// Contador de pendências do menu. `null` enquanto carrega ou quando a importação está desligada
/// no servidor (a API responde 404 e o item some do menu).
final ValueNotifier<int?> pendingCount = ValueNotifier(null);

abstract final class ImportsService {
  /// Atualiza o contador do menu; falhas deixam o item escondido.
  static Future<void> refreshCount() async {
    try {
      final response = await api.get('pending-transactions/', queryParameters: {'page_size': 1});

      pendingCount.value = (response.data as Map)['count'] as int?;
    } catch (_) {
      pendingCount.value = null;
    }
  }

  static Future<List<PendingTransaction>> list({PendingDirection? direction, bool cardPaymentsOnly = false}) =>
      guard('listar as pendências', () async {
        final response = await api.get('pending-transactions/', queryParameters: {
          if (direction != null) 'direction': direction.value,
          if (cardPaymentsOnly) 'flag': 'CARD_PAYMENT',
        });

        return (response.data as List)
            .map((item) => PendingTransaction.fromJson(item as Map<String, dynamic>))
            .toList();
      });

  /// Envia o arquivo direto da memória (nenhuma cópia em disco além da que o seletor faz) e
  /// a senha, quando houver, só no corpo da requisição.
  static Future<ImportBatch> upload({
    required Uint8List bytes,
    required String filename,
    required ImportSource source,
    String? password,
    int? mapping,
  }) =>
      guard('enviar o arquivo', () async {
        final form = FormData.fromMap({
          'file': MultipartFile.fromBytes(bytes, filename: filename),
          'source': source.value,
          if (password != null && password.isNotEmpty) 'password': password,
          'mapping': ?mapping,
        });
        final response = await api.post('imports/', data: form);

        return ImportBatch.fromJson(response.data as Map<String, dynamic>);
      });

  /// Extrato em PDF: o servidor lê e devolve as linhas para revisão, sem gravar nada.
  static Future<PdfPreview> previewPdf({required Uint8List bytes, required String filename, String? password}) =>
      guard('ler o PDF', () async {
        final form = FormData.fromMap({
          'file': MultipartFile.fromBytes(bytes, filename: filename),
          if (password != null && password.isNotEmpty) 'password': password,
        });
        final response = await api.post('imports/preview/', data: form);

        return PdfPreview.fromJson(response.data as Map<String, dynamic>);
      });

  static Future<ImportBatch> confirmPdf(List<StatementRow> rows, String accountRef) => guard('importar o extrato', () async {
        final response = await api.post('imports/confirm/', data: {
          'rows': rows.map((row) => row.toJson()).toList(),
          'account_ref': accountRef,
        });

        return ImportBatch.fromJson(response.data as Map<String, dynamic>);
      });

  static Future<List<ImportBatch>> batches() => guard('listar as importações', () async {
        final response = await api.get('imports/');

        return (response.data as List).map((item) => ImportBatch.fromJson(item as Map<String, dynamic>)).toList();
      });

  static Future<void> deleteBatch(int id) => guard('remover a importação', () async {
        await api.delete('imports/$id/');
      });

  static Future<List<CsvMapping>> mappings() => guard('listar os mapeamentos', () async {
        final response = await api.get('imports/csv-mappings/');

        return (response.data as List).map((item) => CsvMapping.fromJson(item as Map<String, dynamic>)).toList();
      });

  static Future<CsvMapping> saveMapping({
    required String name,
    required String dateColumn,
    required String amountColumn,
    required String descriptionColumn,
    required String dateFormat,
    required String decimalSeparator,
    required bool debitIsNegative,
  }) =>
      guard('salvar o mapeamento', () async {
        final response = await api.post('imports/csv-mappings/', data: {
          'name': name,
          'date_column': dateColumn,
          'amount_column': amountColumn,
          'description_column': descriptionColumn,
          'date_format': dateFormat,
          'decimal_separator': decimalSeparator,
          'debit_is_negative': debitIsNegative,
        });

        return CsvMapping.fromJson(response.data as Map<String, dynamic>);
      });

  static Future<void> register(
    int id, {
    required int family,
    required int category,
    required double amount,
    required DateTime date,
    required String description,
  }) =>
      guard('registrar a pendência', () async {
        await api.post('pending-transactions/$id/import/', data: {
          'family': family,
          'category': category,
          'amount': amount.toStringAsFixed(2),
          'date': toApiDate(date),
          'description': description,
        });
      });

  /// Devolve quantas pendências foram processadas. `family` e `category` só valem para `import`.
  static Future<int> bulk(List<int> ids, {required bool register, int? family, int? category}) =>
      guard('atualizar as pendências', () async {
        final response = await api.post('pending-transactions/bulk/', data: {
          'ids': ids,
          'action': register ? 'import' : 'dismiss',
          if (register) 'family': family,
          if (register) 'category': category,
        });

        return (response.data as Map)['processed'] as int;
      });
}
