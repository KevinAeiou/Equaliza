import 'package:dio/dio.dart';
import 'package:equaliza/core/network/api_exception.dart';
import 'package:equaliza/core/security/screen_security.dart';
import 'package:equaliza/features/imports/import_screen.dart';
import 'package:equaliza/features/shell/app_section.dart';
import 'package:equaliza/models/pending.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';

DioException dioError(int status, Map<String, dynamic> data) {
  final options = RequestOptions(path: '/imports/');

  return DioException(
    requestOptions: options,
    response: Response(requestOptions: options, statusCode: status, data: data),
  );
}

void main() {
  setUpAll(() => initializeDateFormatting('pt_BR'));

  test('PendingTransaction lê débito, crédito e sinalizador de pagamento de fatura', () {
    final debit = PendingTransaction.fromJson({
      'id': 1,
      'direction': 'DEBIT',
      'amount': '45.90',
      'occurred_at': '2026-09-05',
      'description': 'Mercado',
      'flag': 'CARD_PAYMENT',
      'source_category': 'Supermercados',
    });
    final credit = PendingTransaction.fromJson({
      'id': 2,
      'direction': 'CREDIT',
      'amount': '3000.00',
      'occurred_at': '2026-09-10',
      'description': '',
      'kind': 'CREDIT',
    });

    expect(debit.isCredit, isFalse);
    expect(debit.amount, 45.9);
    expect(debit.date, DateTime(2026, 9, 5));
    expect(debit.cardPayment, isTrue);
    expect(credit.isCredit, isTrue);
    expect(credit.title, 'CREDIT');
    expect(PendingTransaction.fromJson({'id': 3, 'direction': 'DEBIT', 'amount': '1', 'occurred_at': '2026-01-01'}).title, 'Sem descrição');
  });

  test('ImportBatch e rótulo do lote', () {
    final batch = ImportBatch.fromJson({
      'id': 7,
      'source': 'CARD_INVOICE',
      'rows_new': 3,
      'rows_duplicated': 1,
      'pending_count': 2,
      'period_start': '2026-09-10',
      'period_end': '2026-09-15',
    });

    expect(batch.source, ImportSource.cardInvoice);
    expect(batchLabel(batch), contains('Fatura'));
    expect(batchLabel(batch), contains('2 pendente(s)'));
    expect(batchLabel(ImportBatch.fromJson({'id': 1, 'source': 'STATEMENT'})), contains('sem período'));
  });

  test('ApiException expõe o código e as colunas do CSV, sem tratá-los como erro de campo', () {
    final password = ApiException.from(dioError(400, {'detail': 'Informe a senha do arquivo.', 'code': 'password_required'}), 'enviar');
    final mapping = ApiException.from(
      dioError(422, {'detail': 'Informe o mapeamento das colunas.', 'code': 'needs_mapping', 'headers': ['Dia', 'Quanto']}),
      'enviar',
    );

    expect(password.code, 'password_required');
    expect(password.message, 'Informe a senha do arquivo.');
    expect(password.fieldErrors, isEmpty);
    expect(mapping.code, 'needs_mapping');
    expect(mapping.headers, ['Dia', 'Quanto']);
    expect(mapping.status, 422);
    expect(ApiException.from(dioError(400, {'amount': ['Inválido']}), 'x').code, isNull);
  });

  test('Pendências só aparecem no menu com a importação ligada', () {
    expect(AppSection.pending.needsImport, isTrue);
    expect(AppSection.pending.adminOnly, isFalse);
    expect(AppSection.values.where((section) => section.needsImport), [AppSection.pending]);
  });

  test('o bloqueio de captura é ignorado onde não há canal nativo', () async {
    TestWidgetsFlutterBinding.ensureInitialized();

    await ScreenSecurity.enable();
    await ScreenSecurity.disable();
  });
}
