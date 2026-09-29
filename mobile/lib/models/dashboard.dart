import 'parsing.dart';

class DashboardSummary {
  const DashboardSummary({
    required this.income,
    required this.expense,
    required this.balance,
  });

  factory DashboardSummary.fromJson(Map<String, dynamic> json) => DashboardSummary(
        income: toDouble(json['income']),
        expense: toDouble(json['expense']),
        balance: toDouble(json['balance']),
      );

  final double income;
  final double expense;
  final double balance;

  double? get savingsRate => income > 0 ? balance / income : null;
}

class MonthTotals {
  const MonthTotals({required this.period, required this.income, required this.expense});

  final String period;
  final double income;
  final double expense;
}

class CategoryTotal {
  const CategoryTotal({required this.category, required this.value});

  final String category;
  final double value;
}

class MemberContribution {
  const MemberContribution({
    required this.member,
    required this.expected,
    required this.paid,
    required this.difference,
  });

  final String member;
  final double expected;
  final double paid;
  final double difference;
}

class DashboardCharts {
  const DashboardCharts({
    required this.incomeVsExpense,
    required this.expensesByCategory,
    required this.memberContributions,
  });

  factory DashboardCharts.fromJson(Map<String, dynamic> json) {
    List<Map<String, dynamic>> list(String key) =>
        (json[key] as List? ?? []).cast<Map<String, dynamic>>();

    return DashboardCharts(
      incomeVsExpense: list('income_vs_expense')
          .map((item) => MonthTotals(
                period: item['period'] as String? ?? '',
                income: toDouble(item['income']),
                expense: toDouble(item['expense']),
              ))
          .toList(),
      expensesByCategory: list('expenses_by_category')
          .map((item) => CategoryTotal(
                category: item['category'] as String? ?? '',
                value: toDouble(item['value']),
              ))
          .toList(),
      memberContributions: list('member_contributions')
          .map((item) => MemberContribution(
                member: item['member'] as String? ?? '',
                expected: toDouble(item['expected']),
                paid: toDouble(item['paid']),
                difference: toDouble(item['difference']),
              ))
          .toList(),
    );
  }

  final List<MonthTotals> incomeVsExpense;
  final List<CategoryTotal> expensesByCategory;
  final List<MemberContribution> memberContributions;
}
