import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/brand.dart';
import '../../core/widgets/error_view.dart';
import '../../core/widgets/overlays.dart';
import '../../models/member.dart';
import '../../models/user.dart';
import '../family/family_service.dart';
import '../shell/app_section.dart';

class MemberScreen extends StatefulWidget {
  const MemberScreen({super.key});

  @override
  State<MemberScreen> createState() => _MemberScreenState();
}

class _MemberScreenState extends State<MemberScreen> {
  List<Member>? _members;
  ApiException? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);

    try {
      final members = await FamilyService.members();
      if (mounted) setState(() => _members = members);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error);
    }
  }

  Future<void> _toggle(Member member) async {
    try {
      await FamilyService.toggleMember(member.id);
      if (!mounted) return;
      showMessage(context, member.isActive ? 'Membro desativado.' : 'Membro reativado.');
      _load();
    } on ApiException catch (error) {
      if (mounted) showMessage(context, error.message);
    }
  }

  Future<void> _remove(Member member) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Remover ${member.name}?',
      description: 'Esta ação removerá o membro da família e excluirá permanentemente todos os dados '
          'vinculados a ele dentro desta família. Essa ação não pode ser desfeita.',
      confirmLabel: 'Remover',
    );

    if (!confirmed || !mounted) return;

    try {
      await FamilyService.removeMember(member.id);
      if (!mounted) return;
      showMessage(context, 'Membro removido.');
      _load();
    } on ApiException catch (error) {
      if (mounted) showMessage(context, error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    if (_error != null && _members == null) {
      return ErrorView.failure(onRetry: _load, note: _error!.message);
    }

    final members = _members;
    final active = members?.where((member) => member.isActive).length ?? 0;

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
        children: [
          const ScreenHeader(title: 'Membros', subtitle: 'Gerencie quem participa das finanças da sua família.'),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () => ShellScope.of(context).navigate(AppSection.invitation),
            icon: const Icon(LucideIcons.userPlus, size: 16),
            label: const Text('Convidar membro'),
          ),
          const SizedBox(height: 16),
          if (members == null)
            for (var index = 0; index < 3; index++) ...[
              if (index > 0) const SizedBox(height: 16),
              const Skeleton(height: 160, radius: 14),
            ]
          else if (members.isEmpty)
            const EmptyCard(
              title: 'Ainda não há outros membros na família.',
              description: 'Convide alguém para dividir as finanças com você.',
            )
          else ...[
            Text(
              '${members.length} ${members.length == 1 ? 'membro' : 'membros'} além de você · '
              '$active ${active == 1 ? 'ativo' : 'ativos'}',
              style: TextStyle(fontSize: 14, color: colors.mutedForeground),
            ),
            for (final member in members) ...[
              const SizedBox(height: 16),
              _MemberCard(member: member, onToggle: () => _toggle(member), onRemove: () => _remove(member)),
            ],
          ],
        ],
      ),
    );
  }
}

class _MemberCard extends StatelessWidget {
  const _MemberCard({required this.member, required this.onToggle, required this.onRemove});

  final Member member;
  final VoidCallback onToggle;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              UserAvatar(name: member.name, avatarId: member.avatarId, size: 48, dimmed: !member.isActive),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      member.name,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      member.email,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 14, color: colors.mutedForeground),
                    ),
                  ],
                ),
              ),
              Transform.translate(
                offset: const Offset(12, -8),
                child: member.role == UserRole.owner
                    ? const LockIndicator(reason: 'O responsável pela família não pode ser desativado nem removido')
                    : ActionMenuButton(
                        tooltip: 'Ações de ${member.name}',
                        items: [
                          ActionItem(member.isActive ? 'Desativar membro' : 'Reativar membro', onToggle),
                          ActionItem('Remover da família', onRemove, destructive: true),
                        ],
                      ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              RolePill(role: member.role),
              Pill(
                label: member.isActive ? 'Ativo' : 'Inativo',
                background: member.isActive ? null : colors.expenseSoft,
                foreground: member.isActive ? colors.income : colors.expenseStrong,
                leading: Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: member.isActive ? colors.income : colors.expense,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
          if (member.joinedAt != null) ...[
            const SizedBox(height: 16),
            const RowDivider(),
            const SizedBox(height: 12),
            Text(
              'Na família desde ${formatMonthYearShort(member.joinedAt!)}',
              style: TextStyle(fontSize: 12, color: colors.mutedForeground),
            ),
          ],
        ],
      ),
    );
  }
}
