import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

/// Cores e temas alinhados à identidade visual do frontend web.
abstract final class AppTheme {
  static const Color primary = AppColors.primary;

  static const double radius = 10;

  static ThemeData get light => _build(Brightness.light, AppColors.light);

  static ThemeData get dark => _build(Brightness.dark, AppColors.dark);

  static ThemeData _build(Brightness brightness, AppColors colors) {
    final colorScheme = ColorScheme(
      brightness: brightness,
      primary: primary,
      onPrimary: Colors.white,
      secondary: colors.muted,
      onSecondary: colors.foreground,
      error: colors.destructive,
      onError: Colors.white,
      surface: colors.card,
      onSurface: colors.foreground,
      onSurfaceVariant: colors.mutedForeground,
      outline: colors.input,
      outlineVariant: colors.border,
      surfaceContainerHighest: colors.muted,
    );

    final base = ThemeData(brightness: brightness, useMaterial3: true);

    final textTheme = GoogleFonts.geistTextTheme(base.textTheme).apply(
      bodyColor: colors.foreground,
      displayColor: colors.foreground,
    );

    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(radius),
    );

    const buttonText = TextStyle(fontSize: 14, fontWeight: FontWeight.w500);

    OutlineInputBorder inputBorder(Color color, [double width = 1]) =>
        OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: color, width: width),
        );

    return base.copyWith(
      colorScheme: colorScheme,
      textTheme: textTheme,
      scaffoldBackgroundColor: colors.page,
      canvasColor: colors.background,
      dividerColor: colors.border,
      extensions: [colors],
      dividerTheme: DividerThemeData(color: colors.border, thickness: 1, space: 1),
      iconTheme: IconThemeData(color: colors.foreground, size: 16),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colors.field,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        hintStyle: TextStyle(color: colors.mutedForeground, fontSize: 16),
        border: inputBorder(colors.input),
        enabledBorder: inputBorder(colors.input),
        disabledBorder: inputBorder(colors.input),
        focusedBorder: inputBorder(primary, 1.5),
        errorBorder: inputBorder(colors.destructive),
        focusedErrorBorder: inputBorder(colors.destructive, 1.5),
        errorStyle: TextStyle(color: colors.destructive, fontSize: 12),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          disabledBackgroundColor: primary.withValues(alpha: 0.5),
          disabledForegroundColor: Colors.white,
          minimumSize: const Size(44, 44),
          shape: shape,
          textStyle: buttonText,
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: colors.foreground,
          backgroundColor: colors.outline,
          minimumSize: const Size(44, 44),
          side: BorderSide(color: colors.input),
          shape: shape,
          textStyle: buttonText,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: colors.income,
          minimumSize: const Size(44, 44),
          shape: shape,
          textStyle: buttonText,
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          foregroundColor: colors.foreground,
          minimumSize: const Size(44, 44),
          shape: shape,
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: colors.card,
        surfaceTintColor: Colors.transparent,
        modalBarrierColor: colors.scrim,
        showDragHandle: true,
        dragHandleColor: colors.handle,
        dragHandleSize: const Size(36, 4),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: colors.card,
        surfaceTintColor: Colors.transparent,
        barrierColor: colors.scrim,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: colors.border),
        ),
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: colors.card,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
          side: BorderSide(color: colors.border),
        ),
        textStyle: textTheme.bodyMedium,
      ),
      drawerTheme: DrawerThemeData(
        backgroundColor: colors.background,
        surfaceTintColor: Colors.transparent,
        shape: const RoundedRectangleBorder(),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: colors.foreground,
        contentTextStyle: TextStyle(color: colors.background, fontSize: 14),
        shape: shape,
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: primary),
      datePickerTheme: DatePickerThemeData(
        backgroundColor: colors.card,
        surfaceTintColor: Colors.transparent,
        headerBackgroundColor: primary,
        headerForegroundColor: Colors.white,
      ),
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: primary,
        selectionColor: primary.withValues(alpha: 0.25),
        selectionHandleColor: primary,
      ),
    );
  }
}
