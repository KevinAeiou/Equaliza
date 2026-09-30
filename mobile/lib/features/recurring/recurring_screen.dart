import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/session/app_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/error_view.dart';
import '../../core/widgets/overlays.dart';
import '../../models/finance.dart';
import '../../models/recurring.dart';
import '../category/category_service.dart';
import 'recurring_form_sheet.dart';
import 'recurring_service.dart';

const _tabular = [FontFeature.tabularFigures()];

/// Lançamentos que se repetem automaticamente, aberta a partir de Finanças.
class RecurringScreen extends StatefulWidget {
  const RecurringScreen({super.key});

  @override
  State<RecurringScreen> createState() => _RecurringScreenState();
}

class _RecurringScreenState extends State<RecurringScreen> {
  List<Recurring>? _items;
  List<Category> _categories = [];
  ApiException? _error;

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _load();
  }

  Future<void> _loadCategories() async {
    try {
      final categories = await CategoryService.list();
      if (mounted) setState(() => _categories = categories);
    } catch (_) {
      // O formulário mostra a lista de categorias vazia.
    }
  }

  Future<void> _load() async {
    setState(() => _error = null);

    try {
      final items = await RecurringService.list();
      if (mounted) setState(() => _items = items);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error);
    }
  }

  Future<void> _openForm([Recurring? recurring]) async {
    final result = await showFormSheet<RecurringResult>(
      context,
      (_) => RecurringFormSheet(categories: _categories, recurring: recurring),
    );

    if (!mounted) return;

    if (result == RecurringResult.saved) _load();
    if (result == RecurringResult.delete && recurring != null) _delete(recurring);
  }

  void _setActive(int id, bool isActive) => setState(() {
        _items = [
          for (final item in _items!)
            if (item.id == id) item.copyWith(isActive: isActive) else item,
        ];
      });

  Future<void> _toggle(Recurring item, bool isActive) async {
    // Atualiza a tela na hora e desfaz se a API recusar.
    _setActive(item.id, isActive);

    try {
      await RecurringService.setActive(item, isActive);
      if (mounted) showMessage(context, isActive ? 'Recorrente ativada.' : 'Recorrente pausada.');
    } on ApiException catch (error) {
      if (!mounted) return;
      _setActive(item.id, !isActive);
      showMessage(context, error.message);
    }
  }

  Future<void> _delete(Recurring item) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Excluir recorrente?',
      description: 'A recorrente "${item.title}" de ${formatCurrency(item.amount)} será excluída e não gerará '
          'novos lançamentos. Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
    );

    if (!confirmed || !mounted) return;

    try {
      await RecurringService.delete(item.id);
      if (!mounted) return;
      setState(() => _items = _items!.where((entry) => entry.id != item.id).toList());
      showMessage(context, 'Recorrente excluída.');
    } on ApiException catch (error) {
      if (mounted) showMessage(context, error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Scaffold(
      backgroundColor: colors.page,
      appBar: AppBar(
        backgroundColor: colors.background,
        surfaceTintColor: Colors.transparent,
        titleSpacing: 0,
        title: const Text('Finanças', style: TextStyle(fontSize: 14)),
        shape: Border(bottom: BorderSide(color: colors.border)),
      ),
      body: _error != null && _items == null
          ? ErrorView.failure(onRetry: _load, note: _error!.message)
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
                children: [
                  const ScreenHeader(title: 'Recorrentes', subtitle: 'Lançamentos que se repetem automaticamente.'),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: () => _openForm(),
                    icon: const Icon(LucideIcons.plus, size: 16),
                    label: const Text('Nova recorrente'),
                  ),
                  const SizedBox(height: 16),
                  _RecurringList(
                    items: _items,
                    currentUserId: AppScope.of(context).session.user.id,
                    onEdit: _openForm,
                    onDelete: _delete,
                    onToggle: _toggle,
                  ),
                ],
              ),
            ),
    );
  }
}

class _RecurringList extends StatelessWidget {
  const _RecurringList({
    required this.items,
    required this.currentUserId,
    required this.onEdit,
    required this.onDelete,
    required this.onToggle,
  });

  final List<Recurring>? items;
  final int currentUserId;
  final ValueChanged<Recurring> onEdit;
  final ValueChanged<Recurring> onDelete;
  final void Function(Recurring item, bool isActive) onToggle;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final list = items;
    final active = list?.where((item) => item.isActive).length ?? 0;
    final paused = (list?.length ?? 0) - active;

    return AppCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (list == null)
            for (var index = 0; index < 4; index++) ...[
              if (index > 0) const RowDivider(),
              const Padding(padding: EdgeInsets.all(12), child: Skeleton(height: 40)),
            ],
          if (list != null && list.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
              child: Text(
                'Nenhuma recorrente cadastrada.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: colors.mutedForeground),
              ),
            ),
          for (final (index, item) in (list ?? const <Recurring>[]).indexed) ...[
            if (index > 0) const RowDivider(),
            _RecurringRow(
              item: item,
              isOwner: item.createdBy?.id == currentUserId,
              onEdit: () => onEdit(item),
              onDelete: () => onDelete(item),
              onToggle: (value) => onToggle(item, value),
            ),
          ],
          if (list != null && list.isNotEmpty) ...[
            const RowDivider(),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Text(
                '$active ${active == 1 ? 'ativa' : 'ativas'}'
                '${paused > 0 ? ' · $paused ${paused == 1 ? 'pausada' : 'pausadas'}' : ''}',
                style: TextStyle(fontSize: 14, color: colors.mutedForeground),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _RecurringRow extends StatelessWidget {
  const _RecurringRow({
    required this.item,
    required this.isOwner,
    required this.onEdit,
    required this.onDelete,
    required this.onToggle,
  });

  final Recurring item;
  final bool isOwner;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final ValueChanged<bool> onToggle;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final income = item.type == EntryType.income;
    final subtitle = TextStyle(fontSize: 12, color: colors.mutedForeground);

    return Opacity(
      opacity: item.isActive ? 1 : 0.6,
      child: Padding(
        padding: const EdgeInsets.only(left: 12, top: 10, bottom: 10),
        child: Row(
          children: [
            IconBadge(
              icon: LucideIcons.repeat,
              background: income ? colors.incomeSoft : colors.expenseSoft,
              foreground: income ? colors.income : colors.expenseStrong,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.title,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${income ? '+' : '−'}${formatCurrency(item.amount)}',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          fontFeatures: _tabular,
                          color: income ? colors.income : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${item.category.name} · ${describeSchedule(item.frequency, item.startDate)}',
                    overflow: TextOverflow.ellipsis,
                    style: subtitle,
                  ),
                  Text(
                    item.isActive
                        ? 'Próxima: ${formatDayMonthYear(item.nextDate)}'
                            '${item.endDate == null ? '' : ' · até ${formatDayMonthYear(item.endDate!)}'}'
                        : 'Pausada · sem novos lançamentos',
                    overflow: TextOverflow.ellipsis,
                    style: subtitle,
                  ),
                ],
              ),
            ),
            // Só quem registrou pode alterar ou remover; o backend também bloqueia.
            if (isOwner) ...[
              Semantics(
                label: '${item.isActive ? 'Pausar' : 'Ativar'} ${item.title}',
                child: Switch(value: item.isActive, onChanged: onToggle),
              ),
              ActionMenuButton(
                tooltip: 'Ações de ${item.title}',
                items: [
                  ActionItem('Editar', onEdit),
                  ActionItem('Excluir', onDelete, destructive: true),
                ],
              ),
            ] else
              const LockIndicator(reason: 'Apenas quem registrou pode editar ou excluir'),
          ],
        ),
      ),
    );
  }
}
