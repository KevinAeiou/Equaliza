import 'package:intl/intl.dart';

import '../../models/dashboard.dart';
import 'formatters.dart';

enum PeriodType {
  day('Dia'),
  week('Semana'),
  month('Mês'),
  year('Ano'),
  range('Intervalo');

  const PeriodType(this.label);

  final String label;

  /// Valor aceito pela API (`period_type`).
  String get apiValue => switch (this) {
        day => 'DAY',
        week => 'WEEK',
        month => 'MONTH',
        year => 'YEAR',
        range => 'PERIOD',
      };
}

class Period {
  const Period(this.from, this.to);

  final DateTime from;
  final DateTime to;

  @override
  bool operator ==(Object other) => other is Period && other.from == from && other.to == to;

  @override
  int get hashCode => Object.hash(from, to);
}

DateTime _day(DateTime date) => DateTime(date.year, date.month, date.day);

/// Período do tipo escolhido que contém [date]. Semanas começam no domingo, como no web.
Period periodFor(PeriodType type, DateTime date) {
  switch (type) {
    case PeriodType.day:
      return Period(_day(date), _day(date));
    case PeriodType.week:
      final start = _day(date).subtract(Duration(days: date.weekday % 7));
      return Period(start, start.add(const Duration(days: 6)));
    case PeriodType.year:
      return Period(DateTime(date.year), DateTime(date.year, 12, 31));
    case PeriodType.month:
    case PeriodType.range:
      return Period(DateTime(date.year, date.month), DateTime(date.year, date.month + 1, 0));
  }
}

Period shiftPeriod(PeriodType type, Period period, int step) {
  switch (type) {
    case PeriodType.day:
      return periodFor(type, period.from.add(Duration(days: step)));
    case PeriodType.week:
      return periodFor(type, period.from.add(Duration(days: 7 * step)));
    case PeriodType.year:
      return periodFor(type, DateTime(period.from.year + step));
    case PeriodType.range:
      final days = (period.to.difference(period.from).inDays + 1) * step;
      return Period(
        period.from.add(Duration(days: days)),
        period.to.add(Duration(days: days)),
      );
    case PeriodType.month:
      return periodFor(type, DateTime(period.from.year, period.from.month + step));
  }
}

String formatPeriodLabel(PeriodType type, Period period) {
  switch (type) {
    case PeriodType.day:
      return DateFormat("d 'de' MMMM 'de' yyyy", 'pt_BR').format(period.from);
    case PeriodType.week:
    case PeriodType.range:
      final format = DateFormat('dd/MM/yy');
      return '${format.format(period.from)} – ${format.format(period.to)}';
    case PeriodType.year:
      return '${period.from.year}';
    case PeriodType.month:
      return capitalize(DateFormat("MMMM 'de' yyyy", 'pt_BR').format(period.from));
  }
}

String toApiDate(DateTime date) => DateFormat('yyyy-MM-dd').format(date);

/// Filtros compartilhados pelo dashboard e pela tela de finanças.
class PeriodFilters {
  const PeriodFilters({
    required this.type,
    required this.period,
    this.categories = const [],
    this.members = const [],
  });

  factory PeriodFilters.initial() =>
      PeriodFilters(type: PeriodType.month, period: periodFor(PeriodType.month, DateTime.now()));

  final PeriodType type;
  final Period period;
  final List<int> categories;
  final List<int> members;

  PeriodFilters copyWith({PeriodType? type, Period? period, List<int>? categories, List<int>? members}) =>
      PeriodFilters(
        type: type ?? this.type,
        period: period ?? this.period,
        categories: categories ?? this.categories,
        members: members ?? this.members,
      );

  Map<String, dynamic> toQuery() => {
        'from_date': toApiDate(period.from),
        'to_date': toApiDate(period.to),
        if (categories.isNotEmpty) 'categories': categories,
        if (members.isNotEmpty) 'members': members,
      };
}

const trendMonths = 6;

/// Os últimos 6 meses até o fim do período filtrado.
Period trendPeriod(Period period) => Period(
      DateTime(period.to.year, period.to.month - (trendMonths - 1)),
      DateTime(period.to.year, period.to.month + 1, 0),
    );

class TrendPoint {
  const TrendPoint({required this.label, required this.income, required this.expense});

  final String label;
  final double income;
  final double expense;
}

/// Preenche os meses sem lançamentos para que o gráfico sempre mostre a mesma janela.
List<TrendPoint> buildTrend(Period period, List<MonthTotals> data) {
  final byPeriod = {for (final item in data) item.period: item};

  return List.generate(trendMonths, (index) {
    final month = DateTime(period.to.year, period.to.month - (trendMonths - 1 - index));
    final item = byPeriod[DateFormat('yyyy-MM').format(month)];

    return TrendPoint(
      label: capitalize(DateFormat('MMM', 'pt_BR').format(month).replaceAll('.', '')),
      income: item?.income ?? 0,
      expense: item?.expense ?? 0,
    );
  });
}

class Settlement {
  const Settlement({required this.from, required this.to, required this.amount});

  final String from;
  final String to;
  final double amount;
}

/// Quem pagou abaixo da cota transfere para quem pagou acima, até zerar as diferenças.
List<Settlement> buildSettlements(List<MemberContribution> contributions) {
  final debtors = [
    for (final item in contributions)
      if (item.difference <= -0.01) (member: item.member, amount: -item.difference),
  ]..sort((a, b) => b.amount.compareTo(a.amount));

  final creditors = [
    for (final item in contributions)
      if (item.difference >= 0.01) (member: item.member, amount: item.difference),
  ]..sort((a, b) => b.amount.compareTo(a.amount));

  final remaining = [for (final creditor in creditors) creditor.amount];
  final settlements = <Settlement>[];
  var index = 0;

  for (final debtor in debtors) {
    var debt = debtor.amount;

    while (debt >= 0.01 && index < creditors.length) {
      final amount = debt < remaining[index] ? debt : remaining[index];

      settlements.add(Settlement(from: debtor.member, to: creditors[index].member, amount: amount));

      debt -= amount;
      remaining[index] -= amount;

      if (remaining[index] < 0.01) index++;
    }
  }

  return settlements;
}
