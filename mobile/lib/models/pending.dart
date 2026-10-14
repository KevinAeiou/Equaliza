import 'parsing.dart';

enum ImportSource {
  statement('STATEMENT', 'Extrato da conta'),
  cardInvoice('CARD_INVOICE', 'Fatura do cartão');

  const ImportSource(this.value, this.label);

  final String value;
  final String label;

  static ImportSource parse(Object? value) => value == cardInvoice.value ? cardInvoice : statement;
}

enum PendingDirection {
  debit('DEBIT'),
  credit('CREDIT');

  const PendingDirection(this.value);

  final String value;

  static PendingDirection parse(Object? value) => value == credit.value ? credit : debit;
}

/// Linha de um extrato ou fatura aguardando decisão. Os textos vêm do banco e são só exibidos.
class PendingTransaction {
  const PendingTransaction({
    required this.id,
    required this.direction,
    required this.amount,
    required this.date,
    required this.description,
    this.kind = '',
    this.sourceCategory = '',
    this.cardPayment = false,
  });

  factory PendingTransaction.fromJson(Map<String, dynamic> json) => PendingTransaction(
        id: json['id'] as int,
        direction: PendingDirection.parse(json['direction']),
        amount: toDouble(json['amount']),
        date: toDay(json['occurred_at']),
        description: json['description'] as String? ?? '',
        kind: json['kind'] as String? ?? '',
        sourceCategory: json['source_category'] as String? ?? '',
        cardPayment: json['flag'] == 'CARD_PAYMENT',
      );

  final int id;
  final PendingDirection direction;
  final double amount;
  final DateTime date;
  final String description;
  final String kind;
  final String sourceCategory;
  final bool cardPayment;

  bool get isCredit => direction == PendingDirection.credit;

  String get title => description.isNotEmpty ? description : (kind.isNotEmpty ? kind : 'Sem descrição');
}

class ImportBatch {
  const ImportBatch({
    required this.id,
    required this.source,
    required this.rowsNew,
    required this.rowsDuplicated,
    required this.pendingCount,
    this.periodStart,
    this.periodEnd,
  });

  factory ImportBatch.fromJson(Map<String, dynamic> json) => ImportBatch(
        id: json['id'] as int,
        source: ImportSource.parse(json['source']),
        rowsNew: json['rows_new'] as int? ?? 0,
        rowsDuplicated: json['rows_duplicated'] as int? ?? 0,
        pendingCount: json['pending_count'] as int? ?? 0,
        periodStart: json['period_start'] == null ? null : toDay(json['period_start']),
        periodEnd: json['period_end'] == null ? null : toDay(json['period_end']),
      );

  final int id;
  final ImportSource source;
  final int rowsNew;
  final int rowsDuplicated;
  final int pendingCount;
  final DateTime? periodStart;
  final DateTime? periodEnd;
}

/// Mapeamento de colunas salvo para CSVs de bancos sem modelo pronto.
class CsvMapping {
  const CsvMapping({required this.id, required this.name});

  factory CsvMapping.fromJson(Map<String, dynamic> json) =>
      CsvMapping(id: json['id'] as int, name: json['name'] as String? ?? '');

  final int id;
  final String name;
}

/// Linha lida de um extrato em PDF, ainda para revisão (nada foi gravado).
class StatementRow {
  const StatementRow({
    required this.date,
    required this.description,
    required this.amount,
    required this.direction,
    this.kind = '',
  });

  factory StatementRow.fromJson(Map<String, dynamic> json) => StatementRow(
        date: toDay(json['date']),
        description: json['description'] as String? ?? '',
        kind: json['kind'] as String? ?? '',
        amount: toDouble(json['amount']),
        direction: PendingDirection.parse(json['direction']),
      );

  final DateTime date;
  final String description;
  final String kind;
  final double amount;
  final PendingDirection direction;

  bool get isCredit => direction == PendingDirection.credit;

  StatementRow withDescription(String value) =>
      StatementRow(date: date, description: value, amount: amount, direction: direction, kind: kind);

  /// O valor volta como texto com duas casas, como a API espera.
  Map<String, dynamic> toJson() => {
        'date': '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}',
        'description': description,
        'kind': kind,
        'amount': amount.toStringAsFixed(2),
        'direction': direction.value,
      };
}

/// Resultado da leitura de um PDF: as linhas e a conferência dos totais com os do extrato.
class PdfPreview {
  const PdfPreview({
    required this.rows,
    required this.accountRef,
    required this.periodStart,
    required this.periodEnd,
    required this.matches,
    required this.parsedIn,
    required this.parsedOut,
    this.pdfIn,
    this.pdfOut,
  });

  factory PdfPreview.fromJson(Map<String, dynamic> json) => PdfPreview(
        rows: (json['rows'] as List).map((item) => StatementRow.fromJson(item as Map<String, dynamic>)).toList(),
        accountRef: json['account_ref'] as String? ?? '',
        periodStart: toDay(json['period_start']),
        periodEnd: toDay(json['period_end']),
        matches: json['matches'] as bool?,
        parsedIn: toDouble(json['parsed_in']),
        parsedOut: toDouble(json['parsed_out']),
        pdfIn: json['pdf_in'] == null ? null : toDouble(json['pdf_in']),
        pdfOut: json['pdf_out'] == null ? null : toDouble(json['pdf_out']),
      );

  final List<StatementRow> rows;
  final String accountRef;
  final DateTime periodStart;
  final DateTime periodEnd;

  /// `null` quando o PDF não traz totais para conferir.
  final bool? matches;
  final double parsedIn;
  final double parsedOut;
  final double? pdfIn;
  final double? pdfOut;
}
