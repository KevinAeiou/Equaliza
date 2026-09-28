import 'package:flutter/material.dart';

/// Tokens de cor do Equaliza, espelhando as variáveis do `globals.css` do frontend.
@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.background,
    required this.page,
    required this.foreground,
    required this.card,
    required this.muted,
    required this.mutedForeground,
    required this.border,
    required this.input,
    required this.field,
    required this.outline,
    required this.handle,
    required this.sheetFooter,
    required this.brand,
    required this.income,
    required this.incomeSoft,
    required this.expense,
    required this.expenseStrong,
    required this.expenseSoft,
    required this.destructive,
    required this.destructiveSoft,
    required this.scrim,
  });

  static const Color primary = Color(0xFF0E7C66);

  static const light = AppColors(
    background: Color(0xFFFFFFFF),
    page: Color(0xFFFCFCFC),
    foreground: Color(0xFF0A0A0A),
    card: Color(0xFFFFFFFF),
    muted: Color(0xFFF5F5F5),
    mutedForeground: Color(0xFF737373),
    border: Color(0xFFE5E5E5),
    input: Color(0xFFE5E5E5),
    field: Color(0x00000000),
    outline: Color(0xFFFFFFFF),
    handle: Color(0xFFD4D4D4),
    sheetFooter: Color(0xFFFAFAFA),
    brand: primary,
    income: Color(0xFF0E7C66),
    incomeSoft: Color(0xFFE3F2EE),
    expense: Color(0xFFE0773A),
    expenseStrong: Color(0xFFA8471A),
    expenseSoft: Color(0xFFFBEBDF),
    destructive: Color(0xFFE7000B),
    destructiveSoft: Color(0x1AE7000B),
    scrim: Color(0x73000000),
  );

  static const dark = AppColors(
    background: Color(0xFF0A0A0A),
    page: Color(0xFF131313),
    foreground: Color(0xFFFAFAFA),
    card: Color(0xFF171717),
    muted: Color(0xFF262626),
    mutedForeground: Color(0xFFA1A1A1),
    border: Color(0x1AFFFFFF),
    input: Color(0x26FFFFFF),
    field: Color(0x0BFFFFFF),
    outline: Color(0x0BFFFFFF),
    handle: Color(0xFF404040),
    sheetFooter: Color(0xFF1C1C1C),
    brand: primary,
    income: Color(0xFF3DBE9C),
    incomeSoft: Color(0x263DBE9C),
    expense: Color(0xFFF0955E),
    expenseStrong: Color(0xFFF4A777),
    expenseSoft: Color(0x26F0955E),
    destructive: Color(0xFFFF6467),
    destructiveSoft: Color(0x33FF6467),
    scrim: Color(0x99000000),
  );

  final Color background;
  final Color page;
  final Color foreground;
  final Color card;
  final Color muted;
  final Color mutedForeground;
  final Color border;
  final Color input;
  final Color field;
  final Color outline;
  final Color handle;
  final Color sheetFooter;
  final Color brand;
  final Color income;
  final Color incomeSoft;
  final Color expense;
  final Color expenseStrong;
  final Color expenseSoft;
  final Color destructive;
  final Color destructiveSoft;
  final Color scrim;

  @override
  AppColors copyWith() => this;

  @override
  AppColors lerp(AppColors? other, double t) {
    if (other == null) return this;

    Color mix(Color a, Color b) => Color.lerp(a, b, t)!;

    return AppColors(
      background: mix(background, other.background),
      page: mix(page, other.page),
      foreground: mix(foreground, other.foreground),
      card: mix(card, other.card),
      muted: mix(muted, other.muted),
      mutedForeground: mix(mutedForeground, other.mutedForeground),
      border: mix(border, other.border),
      input: mix(input, other.input),
      field: mix(field, other.field),
      outline: mix(outline, other.outline),
      handle: mix(handle, other.handle),
      sheetFooter: mix(sheetFooter, other.sheetFooter),
      brand: mix(brand, other.brand),
      income: mix(income, other.income),
      incomeSoft: mix(incomeSoft, other.incomeSoft),
      expense: mix(expense, other.expense),
      expenseStrong: mix(expenseStrong, other.expenseStrong),
      expenseSoft: mix(expenseSoft, other.expenseSoft),
      destructive: mix(destructive, other.destructive),
      destructiveSoft: mix(destructiveSoft, other.destructiveSoft),
      scrim: mix(scrim, other.scrim),
    );
  }
}

extension AppColorsContext on BuildContext {
  AppColors get colors => Theme.of(this).extension<AppColors>()!;
}
