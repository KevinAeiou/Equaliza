import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../models/finance.dart';
import '../../models/user.dart';
import '../theme/app_colors.dart';

/// Superfície padrão dos cards (borda fina, cantos de 14px).
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.highlighted = false,
    this.color,
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final bool highlighted;
  final Color? color;

  /// Torna o card inteiro tocável, com o efeito de toque dentro das bordas.
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final radius = BorderRadius.circular(14);

    if (onTap != null) {
      return SizedBox(
        width: double.infinity,
        child: Material(
          color: color ?? colors.card,
          clipBehavior: Clip.antiAlias,
          shape: RoundedRectangleBorder(
            borderRadius: radius,
            side: color != null
                ? BorderSide.none
                : BorderSide(color: highlighted ? colors.brand : colors.border, width: highlighted ? 2 : 1),
          ),
          child: InkWell(onTap: onTap, child: Padding(padding: padding, child: child)),
        ),
      );
    }

    return Container(
      width: double.infinity,
      padding: padding,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: color ?? colors.card,
        borderRadius: BorderRadius.circular(14),
        border: color != null
            ? null
            : Border.all(color: highlighted ? colors.brand : colors.border, width: highlighted ? 2 : 1),
      ),
      child: child,
    );
  }
}

/// Título e subtítulo no topo de cada tela.
class ScreenHeader extends StatelessWidget {
  const ScreenHeader({super.key, required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 24, height: 1.33, fontWeight: FontWeight.w700, letterSpacing: -0.5),
          ),
          const SizedBox(height: 2),
          Text(subtitle, style: TextStyle(fontSize: 16, height: 1.5, color: context.colors.mutedForeground)),
        ],
      );
}

/// Título e descrição de cards de conteúdo.
class CardTitle extends StatelessWidget {
  const CardTitle({super.key, required this.title, this.description, this.trailing});

  final String title;
  final String? description;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 16, height: 1.5, fontWeight: FontWeight.w600)),
                if (description != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    description!,
                    style: TextStyle(fontSize: 14, height: 1.43, color: context.colors.mutedForeground),
                  ),
                ],
              ],
            ),
          ),
          ?trailing,
        ],
      );
}

/// Ícone dentro de um quadrado com fundo suave.
class IconBadge extends StatelessWidget {
  const IconBadge({
    super.key,
    required this.icon,
    required this.background,
    required this.foreground,
    this.size = 36,
    this.iconSize = 16,
    this.radius = 10,
  });

  final IconData icon;
  final Color background;
  final Color foreground;
  final double size;
  final double iconSize;
  final double radius;

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(radius)),
        child: Icon(icon, size: iconSize, color: foreground),
      );
}

/// Seta de receita (verde) ou despesa (laranja).
class EntryIcon extends StatelessWidget {
  const EntryIcon({super.key, required this.type, this.size = 36, this.iconSize = 16, this.radius = 10});

  final EntryType type;
  final double size;
  final double iconSize;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final income = type == EntryType.income;

    return IconBadge(
      icon: income ? LucideIcons.arrowUpRight : LucideIcons.arrowDownRight,
      background: income ? colors.incomeSoft : colors.expenseSoft,
      foreground: income ? colors.income : colors.expenseStrong,
      size: size,
      iconSize: iconSize,
      radius: radius,
    );
  }
}

/// Etiqueta arredondada (papéis, status).
class Pill extends StatelessWidget {
  const Pill({
    super.key,
    required this.label,
    this.background,
    this.foreground,
    this.bordered = false,
    this.leading,
  });

  final String label;
  final Color? background;
  final Color? foreground;
  final bool bordered;
  final Widget? leading;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Container(
      padding: EdgeInsets.symmetric(horizontal: bordered ? 9 : 10, vertical: bordered ? 1 : 2),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
        border: bordered ? Border.all(color: colors.border) : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (leading != null) ...[leading!, const SizedBox(width: 6)],
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: foreground ?? colors.foreground,
            ),
          ),
        ],
      ),
    );
  }
}

class RolePill extends StatelessWidget {
  const RolePill({super.key, required this.role});

  final String role;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return switch (role) {
      UserRole.owner => Pill(label: role, background: colors.incomeSoft, foreground: colors.income),
      UserRole.admin => Pill(label: role, background: colors.muted),
      _ => Pill(label: role, bordered: true, foreground: colors.mutedForeground),
    };
  }
}

/// Cadeado com a explicação de por que o item não pode ser alterado.
class LockIndicator extends StatelessWidget {
  const LockIndicator({super.key, required this.reason});

  final String reason;

  @override
  Widget build(BuildContext context) => Tooltip(
        message: reason,
        triggerMode: TooltipTriggerMode.tap,
        child: SizedBox(
          width: 44,
          height: 44,
          child: Icon(LucideIcons.lock, size: 14, color: context.colors.mutedForeground, semanticLabel: reason),
        ),
      );
}

/// Card vazio com título e explicação.
class EmptyCard extends StatelessWidget {
  const EmptyCard({super.key, required this.title, this.description, this.action});

  final String title;
  final String? description;
  final Widget? action;

  @override
  Widget build(BuildContext context) => AppCard(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
        child: Column(
          children: [
            Text(title, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w500)),
            if (description != null) ...[
              const SizedBox(height: 8),
              Text(
                description!,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: context.colors.mutedForeground),
              ),
            ],
            if (action != null) ...[const SizedBox(height: 16), action!],
          ],
        ),
      );
}

/// Bloco cinza pulsante enquanto os dados carregam.
class Skeleton extends StatelessWidget {
  const Skeleton({super.key, this.height = 20, this.width, this.radius = 8});

  final double height;
  final double? width;
  final double radius;

  @override
  Widget build(BuildContext context) => Container(
        height: height,
        width: width,
        decoration: BoxDecoration(color: context.colors.muted, borderRadius: BorderRadius.circular(radius)),
      );
}

void showMessage(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

/// Divisória entre linhas de uma lista dentro de card.
class RowDivider extends StatelessWidget {
  const RowDivider({super.key});

  @override
  Widget build(BuildContext context) => Divider(height: 1, color: context.colors.border);
}
