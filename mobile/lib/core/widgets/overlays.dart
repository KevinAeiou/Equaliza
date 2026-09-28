import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../theme/app_colors.dart';

/// Abre um formulário como painel inferior, versão mobile do `FormDialog` do web.
Future<T?> showFormSheet<T>(BuildContext context, WidgetBuilder builder) => showModalBottomSheet<T>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: builder,
    );

/// Estrutura comum dos formulários: cabeçalho com ícone, campos e rodapé de ações.
class FormSheet extends StatelessWidget {
  const FormSheet({
    super.key,
    required this.icon,
    required this.iconBackground,
    required this.iconColor,
    required this.title,
    required this.description,
    required this.formKey,
    required this.children,
    required this.submitLabel,
    required this.onSubmit,
    this.loading = false,
    this.loadingLabel = 'Salvando...',
  });

  final IconData icon;
  final Color iconBackground;
  final Color iconColor;
  final String title;
  final String description;
  final GlobalKey<FormState> formKey;
  final List<Widget> children;
  final String submitLabel;
  final VoidCallback onSubmit;
  final bool loading;
  final String loadingLabel;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(color: iconBackground, borderRadius: BorderRadius.circular(14)),
                  child: Icon(icon, size: 20, color: iconColor),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: const TextStyle(fontSize: 18, height: 1.55, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 4),
                      Text(
                        description,
                        style: TextStyle(fontSize: 14, height: 1.43, color: colors.mutedForeground),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              child: Form(
                key: formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    for (final (index, child) in children.indexed) ...[
                      if (index > 0) const SizedBox(height: 20),
                      child,
                    ],
                  ],
                ),
              ),
            ),
          ),
          SheetFooter(
            children: [
              OutlinedButton(
                onPressed: loading ? null : () => Navigator.pop(context),
                child: const Text('Cancelar'),
              ),
              FilledButton(
                onPressed: loading ? null : onSubmit,
                child: Text(loading ? loadingLabel : submitLabel),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Rodapé com dois botões lado a lado.
class SheetFooter extends StatelessWidget {
  const SheetFooter({super.key, required this.children, this.background = true});

  final List<Widget> children;
  final bool background;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Container(
      decoration: BoxDecoration(
        color: background ? colors.sheetFooter : null,
        border: Border(top: BorderSide(color: colors.border)),
      ),
      padding: EdgeInsets.fromLTRB(20, 16, 20, 16 + MediaQuery.paddingOf(context).bottom),
      child: Row(
        children: [
          for (final (index, child) in children.indexed) ...[
            if (index > 0) const SizedBox(width: 8),
            Expanded(child: child),
          ],
        ],
      ),
    );
  }
}

/// Painel de tela cheia (filtros e configurações), como o `Sheet` lateral do web.
class FullScreenPanel extends StatelessWidget {
  const FullScreenPanel({
    super.key,
    required this.title,
    required this.description,
    required this.body,
    this.footer,
  });

  final String title;
  final String description;
  final Widget body;
  final Widget? footer;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.fromLTRB(24, 20, 6, 20),
              decoration: BoxDecoration(border: Border(bottom: BorderSide(color: colors.border))),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: const TextStyle(fontSize: 18, height: 1.55, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text(description, style: TextStyle(fontSize: 14, color: colors.mutedForeground)),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: 'Fechar',
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(LucideIcons.x, size: 18, color: colors.mutedForeground),
                  ),
                ],
              ),
            ),
            Expanded(child: body),
            ?footer,
          ],
        ),
      ),
    );
  }
}

Future<T?> pushPanel<T>(BuildContext context, WidgetBuilder builder) =>
    Navigator.of(context).push<T>(MaterialPageRoute(builder: builder, fullscreenDialog: true));

/// Confirmação de ação destrutiva, como o `AlertDialog` do web.
Future<bool> showConfirmDialog(
  BuildContext context, {
  required String title,
  required String description,
  required String confirmLabel,
  IconData icon = LucideIcons.trash2,
}) async {
  final colors = context.colors;

  final result = await showDialog<bool>(
    context: context,
    builder: (context) => Dialog(
      insetPadding: const EdgeInsets.all(24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 320),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(color: colors.destructiveSoft, borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, size: 24, color: colors.destructive),
              ),
              const SizedBox(height: 20),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 18, height: 1.55, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              Text(
                description,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, height: 1.43, color: colors.mutedForeground),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Cancelar'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: colors.destructiveSoft,
                        foregroundColor: colors.destructive,
                      ),
                      onPressed: () => Navigator.pop(context, true),
                      child: Text(confirmLabel, textAlign: TextAlign.center),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    ),
  );

  return result ?? false;
}
