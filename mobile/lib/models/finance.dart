import 'parsing.dart';

enum EntryType {
  expense('EXPENSE', 'expenses/', 'despesa', 'Despesas'),
  income('INCOME', 'income/', 'receita', 'Receitas');

  const EntryType(this.value, this.endpoint, this.singular, this.plural);

  final String value;
  final String endpoint;
  final String singular;
  final String plural;

  static EntryType parse(Object? value) =>
      value == income.value ? income : expense;
}

/// Membro da família que pode ter registrado lançamentos (`id` é o do usuário).
class FinanceMember {
  const FinanceMember({required this.id, required this.name});

  factory FinanceMember.fromJson(Map<String, dynamic> json) =>
      FinanceMember(id: json['id'] as int, name: json['name'] as String? ?? '');

  final int id;
  final String name;
}

class Category {
  const Category({
    required this.id,
    required this.name,
    required this.type,
    this.isDefault = false,
    this.usageCount,
  });

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: json['id'] as int,
        name: json['name'] as String? ?? '',
        type: EntryType.parse(json['type']),
        isDefault: json['is_default'] as bool? ?? false,
        usageCount: json['usage_count'] as int?,
      );

  final int id;
  final String name;
  final EntryType type;
  final bool isDefault;
  final int? usageCount;

  bool get inUse => (usageCount ?? 0) > 0;
}

class Author {
  const Author({required this.id, required this.name});

  final int id;
  final String name;
}

class FinanceEntry {
  const FinanceEntry({
    required this.id,
    required this.type,
    required this.amount,
    required this.date,
    required this.category,
    this.createdBy,
    this.description,
    this.createdAt,
    this.updatedAt,
  });

  factory FinanceEntry.fromJson(Map<String, dynamic> json, EntryType type) {
    final author = json['created_by'];

    return FinanceEntry(
      id: json['id'] as int,
      type: type,
      amount: toDouble(json['amount']),
      date: toDay(json['date']),
      category: Category.fromJson(json['category'] as Map<String, dynamic>),
      createdBy: author is Map
          ? Author(id: author['id'] as int, name: author['name'] as String? ?? '')
          : null,
      description: json['description'] as String?,
      createdAt: toDate(json['created_at']),
      updatedAt: toDate(json['updated_at']),
    );
  }

  final int id;
  final EntryType type;
  final double amount;
  final DateTime date;
  final Category category;
  final Author? createdBy;
  final String? description;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  bool get hasDescription => (description ?? '').trim().isNotEmpty;

  String get title => hasDescription ? description!.trim() : category.name;
}
