import 'finance.dart';
import 'parsing.dart';

enum RecurrenceFrequency {
  weekly('WEEKLY', 'Semanal'),
  monthly('MONTHLY', 'Mensal'),
  yearly('YEARLY', 'Anual');

  const RecurrenceFrequency(this.value, this.label);

  final String value;
  final String label;

  static RecurrenceFrequency parse(Object? value) =>
      values.firstWhere((frequency) => frequency.value == value, orElse: () => monthly);
}

class Recurring {
  const Recurring({
    required this.id,
    required this.type,
    required this.amount,
    required this.category,
    required this.frequency,
    required this.startDate,
    required this.nextDate,
    required this.isActive,
    this.endDate,
    this.description,
    this.createdBy,
  });

  factory Recurring.fromJson(Map<String, dynamic> json) {
    final author = json['created_by'];

    return Recurring(
      id: json['id'] as int,
      type: EntryType.parse(json['type']),
      amount: toDouble(json['amount']),
      category: Category.fromJson(json['category'] as Map<String, dynamic>),
      frequency: RecurrenceFrequency.parse(json['frequency']),
      startDate: toDay(json['start_date']),
      endDate: json['end_date'] == null ? null : toDay(json['end_date']),
      nextDate: toDay(json['next_date']),
      isActive: json['is_active'] as bool? ?? true,
      description: json['description'] as String?,
      createdBy: author is Map
          ? Author(id: author['id'] as int, name: author['name'] as String? ?? '')
          : null,
    );
  }

  final int id;
  final EntryType type;
  final double amount;
  final Category category;
  final RecurrenceFrequency frequency;
  final DateTime startDate;
  final DateTime? endDate;
  final DateTime nextDate;
  final bool isActive;
  final String? description;
  final Author? createdBy;

  Recurring copyWith({bool? isActive}) => Recurring(
        id: id,
        type: type,
        amount: amount,
        category: category,
        frequency: frequency,
        startDate: startDate,
        endDate: endDate,
        nextDate: nextDate,
        isActive: isActive ?? this.isActive,
        description: description,
        createdBy: createdBy,
      );

  bool get hasDescription => (description ?? '').trim().isNotEmpty;

  String get title => hasDescription ? description!.trim() : category.name;
}
