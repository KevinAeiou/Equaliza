import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../theme/app_colors.dart';
import 'brand.dart';

enum ErrorVariant { notFound, unauthorized, error }

/// Tela de erro com o símbolo da marca, como o `ErrorScreen` do web.
class ErrorView extends StatelessWidget {
  const ErrorView({
    super.key,
    required this.variant,
    required this.code,
    required this.title,
    required this.description,
    this.note,
    this.onRetry,
    this.onHome,
    this.onBack,
  });

  const ErrorView.notFound({super.key, this.onHome, this.onBack})
      : variant = ErrorVariant.notFound,
        code = 'Erro 404',
        title = 'Página não encontrada',
        description = 'O endereço pode estar incorreto ou a página pode ter sido movida ou removida.',
        note = null,
        onRetry = null;

  const ErrorView.unauthorized({super.key, this.onHome, this.onBack})
      : variant = ErrorVariant.unauthorized,
        code = 'Erro 403',
        title = 'Acesso restrito',
        description = 'Esta área é exclusiva para responsáveis e administradores da família selecionada.',
        note = 'Se precisar de acesso, peça ao responsável pela família para mudar sua função, '
            'ou troque para outra família em que você seja administrador.',
        onRetry = null;

  const ErrorView.failure({super.key, required this.onRetry, this.note})
      : variant = ErrorVariant.error,
        code = 'Algo deu errado',
        title = 'Não foi possível carregar esta página',
        description = 'Ocorreu um erro inesperado. Tente novamente; se o problema continuar, volte mais tarde.',
        onHome = null,
        onBack = null;

  final ErrorVariant variant;
  final String code;
  final String title;
  final String description;
  final String? note;
  final VoidCallback? onRetry;
  final VoidCallback? onHome;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    final (badgeIcon, badgeColor) = switch (variant) {
      ErrorVariant.notFound => (LucideIcons.searchX, colors.mutedForeground),
      ErrorVariant.unauthorized => (LucideIcons.lock, colors.expenseStrong),
      ErrorVariant.error => (LucideIcons.triangleAlert, colors.expenseStrong),
    };

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 64),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 112,
                  height: 112,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: colors.incomeSoft, borderRadius: BorderRadius.circular(24)),
                  child: BrandGlyph(tilted: variant == ErrorVariant.notFound),
                ),
                Positioned(
                  right: -12,
                  bottom: -12,
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: colors.background,
                      shape: BoxShape.circle,
                      border: Border.all(color: colors.border),
                    ),
                    child: Icon(badgeIcon, size: 20, color: badgeColor),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            Text(
              code.toUpperCase(),
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                letterSpacing: 1.4,
                color: colors.mutedForeground,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 30, height: 1.2, fontWeight: FontWeight.w600, letterSpacing: -0.6),
            ),
            const SizedBox(height: 12),
            Text(
              description,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, height: 1.5, color: colors.mutedForeground),
            ),
            const SizedBox(height: 32),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 320),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (onRetry != null)
                    FilledButton.icon(
                      onPressed: onRetry,
                      icon: const Icon(LucideIcons.rotateCw, size: 16),
                      label: const Text('Tentar novamente'),
                    )
                  else if (onHome != null)
                    FilledButton.icon(
                      onPressed: onHome,
                      icon: const Icon(LucideIcons.house, size: 16),
                      label: const Text('Ir para o dashboard'),
                    ),
                  if (onBack != null) ...[
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: onBack,
                      icon: const Icon(LucideIcons.arrowLeft, size: 16),
                      label: const Text('Voltar'),
                    ),
                  ],
                ],
              ),
            ),
            if (note != null) ...[
              const SizedBox(height: 32),
              Text(
                note!,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, height: 1.43, color: colors.mutedForeground),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Tela 404 para rotas desconhecidas.
class NotFoundScreen extends StatelessWidget {
  const NotFoundScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: context.colors.background,
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(padding: EdgeInsets.fromLTRB(16, 20, 16, 0), child: AppLogo(height: 31)),
              Expanded(
                child: ErrorView.notFound(
                  onHome: () => Navigator.of(context).popUntil((route) => route.isFirst),
                  onBack: Navigator.of(context).canPop() ? () => Navigator.pop(context) : null,
                ),
              ),
            ],
          ),
        ),
      );
}
