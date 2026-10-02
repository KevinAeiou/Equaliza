import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/brand.dart';

/// Moldura das telas públicas: faixa da marca no topo e o conteúdo num painel arredondado.
///
/// Na tela inicial a faixa mostra o slogan; nas telas empilhadas, o botão de voltar.
class AuthShell extends StatelessWidget {
  const AuthShell({
    super.key,
    required this.children,
    this.footer,
    this.tallBand = false,
  });

  final List<Widget> children;

  /// Fica no fim do painel, como o link para alternar entre login e cadastro.
  final Widget? footer;

  /// Mantém a faixa com slogan do login mesmo em tela empilhada (com o botão de voltar),
  /// para o painel ter a mesma altura.
  final bool tallBand;

  static const _radius = 12.0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.colors;
    final dark = theme.brightness == Brightness.dark;
    final canPop = ModalRoute.of(context)?.canPop ?? false;
    final gutter = ((MediaQuery.sizeOf(context).width - 440) / 2).clamp(
      24.0,
      double.infinity,
    );

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: dark ? const Color(0xFF0B4A3E) : AppColors.primary,
        body: CustomScrollView(
          physics: const ClampingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: _BrandBand(canPop: canPop, dark: dark, tall: tallBand),
            ),
            SliverFillRemaining(
              hasScrollBody: false,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: colors.background,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(28),
                  ),
                ),
                child: SafeArea(
                  top: false,
                  // Centraliza numa coluna de até 440 px sem afrouxar a altura, para o rodapé descer.
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(gutter, 32, gutter, 20),
                    child: Theme(
                      data: _authTheme(theme),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          for (final (index, child) in children.indexed) ...[
                            if (index > 0) const SizedBox(height: 28),
                            child,
                          ],
                          if (footer != null) ...[
                            const Spacer(),
                            const SizedBox(height: 20),
                            footer!,
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Campos e botões um pouco maiores que no restante do app.
  static ThemeData _authTheme(ThemeData theme) {
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(_radius),
    );

    InputBorder? rounded(InputBorder? border) => border is OutlineInputBorder
        ? border.copyWith(borderRadius: BorderRadius.circular(_radius))
        : border;

    final inputs = theme.inputDecorationTheme;

    return theme.copyWith(
      inputDecorationTheme: inputs.copyWith(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 15,
        ),
        border: rounded(inputs.border),
        enabledBorder: rounded(inputs.enabledBorder),
        disabledBorder: rounded(inputs.disabledBorder),
        focusedBorder: rounded(inputs.focusedBorder),
        errorBorder: rounded(inputs.errorBorder),
        focusedErrorBorder: rounded(inputs.focusedErrorBorder),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: theme.filledButtonTheme.style?.copyWith(
          minimumSize: const WidgetStatePropertyAll(Size(44, 52)),
          shape: WidgetStatePropertyAll(shape),
          textStyle: const WidgetStatePropertyAll(
            TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: theme.outlinedButtonTheme.style?.copyWith(
          minimumSize: const WidgetStatePropertyAll(Size(44, 50)),
          shape: WidgetStatePropertyAll(shape),
          textStyle: const WidgetStatePropertyAll(
            TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
          ),
        ),
      ),
    );
  }
}

class _BrandBand extends StatelessWidget {
  const _BrandBand({
    required this.canPop,
    required this.dark,
    required this.tall,
  });

  final bool canPop;
  final bool dark;
  final bool tall;

  Widget _backButton(BuildContext context) => IconButton(
    tooltip: 'Voltar',
    onPressed: () => Navigator.of(context).maybePop(),
    style: IconButton.styleFrom(
      backgroundColor: Colors.white.withValues(alpha: 0.14),
      foregroundColor: Colors.white,
      shape: const CircleBorder(),
    ),
    icon: const Icon(LucideIcons.chevronLeft, size: 20),
  );

  @override
  Widget build(BuildContext context) {
    final compact = canPop && !tall;
    // O botão de voltar (48 px) divide a linha do logo (34 px); o padding compensa a diferença.
    final withBack = canPop && tall;

    return Stack(
      clipBehavior: Clip.hardEdge,
      children: [
        // Balança do ícone em marca-d'água.
        Positioned(
          right: compact ? -40 : -52,
          top: compact ? 8 : 64,
          child: Opacity(
            opacity: dark ? 0.08 : 0.09,
            child: BrandGlyph(size: compact ? 156 : 200, color: Colors.white),
          ),
        ),
        SafeArea(
          bottom: false,
          child: compact
              ? Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 52),
                  child: Row(
                    children: [
                      _backButton(context),
                      const SizedBox(width: 16),
                      const AppLogo(height: 28, white: true),
                    ],
                  ),
                )
              : Padding(
                  padding: EdgeInsets.fromLTRB(
                    withBack ? 16 : 28,
                    withBack ? 17 : 24,
                    28,
                    60,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (withBack)
                        Row(
                          children: [
                            _backButton(context),
                            const SizedBox(width: 16),
                            const AppLogo(height: 34, white: true),
                          ],
                        )
                      else
                        const AppLogo(height: 34, white: true),
                      SizedBox(height: withBack ? 13 : 20),
                      Padding(
                        padding: EdgeInsets.only(left: withBack ? 12 : 0),
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 280),
                          child: Text(
                            'Gerencie as finanças da sua família de forma simples, colaborativa e inteligente.',
                            style: TextStyle(
                              fontSize: 16,
                              height: 1.5,
                              color: dark
                                  ? const Color(0xFFCFE8E1)
                                  : const Color(0xFFE2F2EE),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
        ),
      ],
    );
  }
}

class AuthHeader extends StatelessWidget {
  const AuthHeader({super.key, required this.title, required this.description});

  final String title;
  final String description;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        title,
        style: const TextStyle(
          fontSize: 26,
          height: 1.25,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.6,
        ),
      ),
      const SizedBox(height: 6),
      Text(
        description,
        style: TextStyle(
          fontSize: 15,
          height: 1.45,
          color: context.colors.mutedForeground,
        ),
      ),
    ],
  );
}

/// Grupo de campos com título em caixa alta ("Seus dados", "Acesso").
class AuthSection extends StatelessWidget {
  const AuthSection({super.key, required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Semantics(
        header: true,
        child: Text(
          title.toUpperCase(),
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.8,
            color: context.colors.mutedForeground,
          ),
        ),
      ),
      for (final child in children) ...[const SizedBox(height: 16), child],
    ],
  );
}

/// Separador "ou" entre a ação principal e a alternativa.
class AuthDivider extends StatelessWidget {
  const AuthDivider({super.key});

  @override
  Widget build(BuildContext context) => Row(
    children: [
      const Expanded(child: Divider()),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Text(
          'ou',
          style: TextStyle(fontSize: 13, color: context.colors.mutedForeground),
        ),
      ),
      const Expanded(child: Divider()),
    ],
  );
}

/// Regra da senha, que fica verde quando atendida.
class PasswordRule extends StatelessWidget {
  const PasswordRule({super.key, required this.controller, this.minLength = 8});

  final TextEditingController controller;
  final int minLength;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) {
        final color = controller.text.length >= minLength
            ? colors.income
            : colors.mutedForeground;

        return Row(
          children: [
            Icon(LucideIcons.check, size: 14, color: color),
            const SizedBox(width: 6),
            Text(
              'Mínimo de $minLength caracteres',
              style: TextStyle(fontSize: 13, color: color),
            ),
          ],
        );
      },
    );
  }
}

/// "Ainda não tem uma conta? Criar conta".
class AuthSwitchLink extends StatelessWidget {
  const AuthSwitchLink({
    super.key,
    required this.question,
    required this.action,
    required this.onTap,
  });

  final String question;
  final String action;
  final VoidCallback onTap;

  @override
  // Wrap para não estourar com a fonte do sistema ampliada.
  Widget build(BuildContext context) => Wrap(
    alignment: WrapAlignment.center,
    crossAxisAlignment: WrapCrossAlignment.center,
    children: [
      Text(
        question,
        style: TextStyle(fontSize: 15, color: context.colors.mutedForeground),
      ),
      TextButton(
        onPressed: onTap,
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
        child: Text(action),
      ),
    ],
  );
}
