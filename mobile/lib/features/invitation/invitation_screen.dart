import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/error_view.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/overlays.dart';
import '../../models/member.dart';
import 'invitation_form_sheet.dart';
import 'invitation_service.dart';

enum _StatusFilter {
  all('Todos', null),
  pending('Pendentes', 'Pendente'),
  accepted('Aceitos', 'Aceito'),
  expired('Expirados', 'Expirado');

  const _StatusFilter(this.label, this.status);

  final String label;
  final String? status;
}

class InvitationScreen extends StatefulWidget {
  const InvitationScreen({super.key});

  @override
  State<InvitationScreen> createState() => _InvitationScreenState();
}

class _InvitationScreenState extends State<InvitationScreen> {
  List<Invitation>? _invites;
  ApiException? _error;
  _StatusFilter _filter = _StatusFilter.all;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);

    try {
      final invites = await InvitationService.list();
      if (mounted) setState(() => _invites = invites);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error);
    }
  }

  Future<void> _openForm() async {
    final sent = await showFormSheet<bool>(context, (_) => const InvitationFormSheet());

    if (sent == true) _load();
  }

  Future<void> _copy(Invitation invite) async {
    await Clipboard.setData(ClipboardData(text: invite.link));
    if (mounted) showMessage(context, 'Link do convite copiado.');
  }

  Future<void> _delete(Invitation invite) async {
    final confirmed = await showConfirmDialog(
      context,
      title: invite.pending ? 'Cancelar convite?' : 'Excluir do histórico?',
      description: invite.pending
          ? 'O link enviado para ${invite.email} deixará de funcionar.'
          : 'O convite para ${invite.email} será removido do histórico.',
      confirmLabel: invite.pending ? 'Cancelar convite' : 'Excluir',
    );

    if (!confirmed || !mounted) return;

    try {
      await InvitationService.delete(invite.id);
      if (!mounted) return;
      showMessage(context, invite.pending ? 'Convite cancelado.' : 'Convite excluído.');
      _load();
    } on ApiException catch (error) {
      if (mounted) showMessage(context, error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    if (_error != null && _invites == null) {
      return ErrorView.failure(onRetry: _load, note: _error!.message);
    }

    final invites = _invites;

    int count(_StatusFilter filter) =>
        invites?.where((invite) => filter.status == null || invite.status == filter.status).length ?? 0;

    final visible = invites?.where((invite) => _filter.status == null || invite.status == _filter.status).toList();

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
        children: [
          const ScreenHeader(
            title: 'Convites',
            subtitle: 'Convide pessoas para a família e acompanhe cada convite.',
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _openForm,
            icon: const Icon(LucideIcons.plus, size: 16),
            label: const Text('Novo convite'),
          ),
          const SizedBox(height: 16),
          SegmentedControl(
            fontSize: 13,
            options: [
              for (final filter in _StatusFilter.values)
                SegmentOption(filter, filter.label, trailing: invites == null ? null : '${count(filter)}'),
            ],
            value: _filter,
            onChanged: (filter) => setState(() => _filter = filter),
          ),
          const SizedBox(height: 16),
          AppCard(
            padding: EdgeInsets.zero,
            child: visible == null
                ? Padding(
                    padding: const EdgeInsets.symmetric(vertical: 40),
                    child: Text(
                      'Carregando convites...',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, color: colors.mutedForeground),
                    ),
                  )
                : visible.isEmpty
                    ? Padding(
                        padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
                        child: Column(
                          children: [
                            Text(
                              invites!.isEmpty ? 'Nenhum convite enviado ainda.' : 'Nenhum convite com este status.',
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontWeight: FontWeight.w500),
                            ),
                            if (invites.isEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                'Convide alguém para participar das finanças da família.',
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 14, color: colors.mutedForeground),
                              ),
                            ],
                          ],
                        ),
                      )
                    : Column(
                        children: [
                          for (final (index, invite) in visible.indexed) ...[
                            if (index > 0) const RowDivider(),
                            _InviteRow(
                              invite: invite,
                              onCopy: () => _copy(invite),
                              onDelete: () => _delete(invite),
                            ),
                          ],
                        ],
                      ),
          ),
        ],
      ),
    );
  }
}

class _InviteRow extends StatelessWidget {
  const _InviteRow({required this.invite, required this.onCopy, required this.onDelete});

  final Invitation invite;
  final VoidCallback onCopy;
  final VoidCallback onDelete;

  String _describe() {
    String day(DateTime? date) => date == null ? '—' : formatDayOfMonth(date);

    final sent = 'Enviado em ${day(invite.createdAt)}';

    if (invite.status == 'Aceito' && invite.acceptedAt != null) return '$sent · aceito em ${day(invite.acceptedAt)}';
    if (invite.status == 'Expirado') return '$sent · expirou em ${day(invite.expiresAt)}';

    return '$sent · expira em ${day(invite.expiresAt)}';
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    final (icon, background, foreground) = switch (invite.status) {
      'Aceito' => (LucideIcons.circleCheck, colors.incomeSoft, colors.income),
      'Expirado' => (LucideIcons.clock, colors.expenseSoft, colors.expenseStrong),
      _ => (LucideIcons.mail, colors.muted, colors.foreground),
    };

    return InkWell(
      // Tocar na linha abre as ações do convite.
      onTap: () => showActionSheet(
        context,
        icon: icon,
        iconBackground: background,
        iconColor: foreground,
        title: invite.email.isEmpty ? 'Convite sem e-mail' : invite.email,
        description: _describe(),
        actions: [
          if (invite.pending) SheetAction('Copiar link do convite', LucideIcons.copy, onCopy),
          SheetAction(
            invite.pending ? 'Cancelar convite' : 'Excluir do histórico',
            LucideIcons.trash2,
            onDelete,
            destructive: true,
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        child: Row(
          children: [
            IconBadge(icon: icon, background: background, foreground: foreground),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    invite.email.isEmpty ? 'Convite sem e-mail' : invite.email,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 2),
                  Text(_describe(), style: TextStyle(fontSize: 12, height: 1.33, color: colors.mutedForeground)),
                ],
              ),
            ),
            if (invite.pending)
              SizedBox(
                width: 44,
                height: 44,
                child: OutlinedButton(
                  onPressed: onCopy,
                  style: OutlinedButton.styleFrom(padding: EdgeInsets.zero),
                  child: const Icon(LucideIcons.copy, size: 14, semanticLabel: 'Copiar link do convite'),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
