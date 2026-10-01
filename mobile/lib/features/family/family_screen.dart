import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/session/app_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/brand.dart';
import '../../core/widgets/error_view.dart';
import '../../core/widgets/overlays.dart';
import '../../models/user.dart';
import '../auth/invitation_code_sheet.dart';
import 'family_form_sheet.dart';
import 'family_service.dart';

class FamilyScreen extends StatefulWidget {
  const FamilyScreen({super.key});

  @override
  State<FamilyScreen> createState() => _FamilyScreenState();
}

class _FamilyScreenState extends State<FamilyScreen> {
  List<FamilyOverview>? _families;
  ApiException? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);

    try {
      final families = await FamilyService.list();
      if (mounted) setState(() => _families = families);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error);
    }
  }

  /// Atualiza a lista e o usuário, cuja lista de famílias aparece no menu.
  Future<void> _reload() async {
    await AppScope.read(context).session.refreshUser();
    await _load();
  }

  Future<void> _openForm([FamilyOverview? family]) async {
    final saved = await showFormSheet<bool>(context, (_) => FamilyFormSheet(family: family));

    if (saved == true && mounted) await _reload();
  }

  Future<void> _use(FamilyOverview family) async {
    try {
      // Trocar a família atual recria esta tela com os dados da nova família.
      await AppScope.read(context).session.changeCurrentFamily(family.id);
    } on ApiException catch (error) {
      if (mounted) showMessage(context, error.message);
    }
  }

  Future<void> _delete(FamilyOverview family) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Excluir ${family.name}?',
      description: 'Todas as receitas, despesas, categorias, membros e convites desta família serão '
          'excluídos permanentemente. Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir família',
    );

    if (!confirmed || !mounted) return;

    try {
      await FamilyService.delete(family.id);
      if (!mounted) return;
      showMessage(context, 'Família excluída.');
      await _reload();
    } on ApiException catch (error) {
      if (mounted) showMessage(context, error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null && _families == null) {
      return ErrorView.failure(onRetry: _load, note: _error!.message);
    }

    final currentId = AppScope.of(context).session.user.currentFamily?.id;
    final families = [...?_families]
      ..sort((a, b) => (b.id == currentId ? 1 : 0) - (a.id == currentId ? 1 : 0));

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
        children: [
          const ScreenHeader(
            title: 'Famílias',
            subtitle: 'Veja as famílias de que você participa e escolha qual está usando.',
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () => _openForm(),
            icon: const Icon(LucideIcons.plus, size: 16),
            label: const Text('Nova família'),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () async {
              await openInvitationCode(context);
              if (mounted) await _reload();
            },
            icon: Icon(LucideIcons.ticket, size: 16, color: context.colors.income),
            label: const Text('Tenho um código de convite'),
          ),
          const SizedBox(height: 16),
          if (_families == null)
            for (var index = 0; index < 2; index++) ...[
              if (index > 0) const SizedBox(height: 16),
              const Skeleton(height: 190, radius: 14),
            ]
          else if (families.isEmpty)
            const EmptyCard(
              title: 'Você ainda não participa de nenhuma família.',
              description: 'Crie uma família ou peça um convite para começar a organizar as finanças.',
            )
          else
            for (final (index, family) in families.indexed) ...[
              if (index > 0) const SizedBox(height: 16),
              _FamilyCard(
                family: family,
                current: family.id == currentId,
                onRename: () => _openForm(family),
                onDelete: () => _delete(family),
                onUse: () => _use(family),
              ),
            ],
        ],
      ),
    );
  }
}

class _FamilyCard extends StatelessWidget {
  const _FamilyCard({
    required this.family,
    required this.current,
    required this.onRename,
    required this.onDelete,
    required this.onUse,
  });

  final FamilyOverview family;
  final bool current;
  final VoidCallback onRename;
  final VoidCallback onDelete;
  final VoidCallback onUse;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return AppCard(
      highlighted: current,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FamilyMonogram(name: family.name, current: current, size: 48),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      family.name,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        if (family.role != null) RolePill(role: family.role!),
                        if (current)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(LucideIcons.check, size: 14, color: colors.income),
                              const SizedBox(width: 4),
                              Text(
                                'Família atual',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: colors.income),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              if (family.role == UserRole.owner)
                Transform.translate(
                  offset: const Offset(12, -8),
                  child: ActionMenuButton(
                    tooltip: 'Ações de ${family.name}',
                    items: [
                      ActionItem('Renomear', onRename),
                      ActionItem('Excluir família', onDelete, destructive: true),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 16,
            runSpacing: 4,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.users, size: 16, color: colors.mutedForeground),
                  const SizedBox(width: 6),
                  Text(
                    '${family.membersCount} ${family.membersCount == 1 ? 'membro ativo' : 'membros ativos'}',
                    style: TextStyle(fontSize: 14, color: colors.mutedForeground),
                  ),
                ],
              ),
              if (family.createdAt != null)
                Text(
                  'Criada em ${formatMonthYearShort(family.createdAt!)}',
                  style: TextStyle(fontSize: 14, color: colors.mutedForeground),
                ),
            ],
          ),
          const SizedBox(height: 16),
          const RowDivider(),
          const SizedBox(height: 16),
          if (current)
            Text(
              'Os dados exibidos no app são desta família.',
              style: TextStyle(fontSize: 14, color: colors.mutedForeground),
            )
          else if (family.isActiveMember)
            OutlinedButton(onPressed: onUse, child: const Text('Usar esta família'))
          else
            Text(
              'Seu acesso a esta família está desativado.',
              style: TextStyle(fontSize: 14, color: colors.expenseStrong),
            ),
        ],
      ),
    );
  }
}
