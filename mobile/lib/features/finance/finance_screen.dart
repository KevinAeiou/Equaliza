import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/session/app_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/period.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/error_view.dart';
import '../../core/widgets/overlays.dart';
import '../../core/widgets/period_filters.dart';
import '../../models/dashboard.dart';
import '../../models/finance.dart';
import '../category/category_service.dart';
import '../dashboard/dashboard_service.dart';
import 'finance_form_sheet.dart';
import 'finance_service.dart';

const _tabular = [FontFeature.tabularFigures()];

class FinanceScreen extends StatefulWidget {
  const FinanceScreen({super.key});

  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen> {
  EntryType _type = EntryType.expense;
  PeriodFilters _filters = PeriodFilters.initial();
  List<Category> _categories = [];
  List<FinanceEntry>? _entries;
  DashboardSummary? _summary;
  ApiException? _error;
  int _request = 0;

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
      // O formulário e os filtros mostram a lista vazia.
    }
  }

  Future<void> _load() async {
    final request = ++_request;
    final type = _type;
    final filters = _filters;

    setState(() => _error = null);

    try {
      // Os totais ignoram o filtro de categorias, que vale só para o tipo exibido na lista.
      final results = await Future.wait([
        FinanceService.list(type, filters),
        DashboardService.summary(filters.copyWith(categories: [])),
      ]);

      if (!mounted || request != _request) return;

      setState(() {
        _entries = results[0] as List<FinanceEntry>;
        _summary = results[1] as DashboardSummary;
      });
    } on ApiException catch (error) {
      if (mounted && request == _request) setState(() => _error = error);
    }
  }

  void _apply({EntryType? type, PeriodFilters? filters}) {
    setState(() {
      // As categorias do filtro pertencem a um tipo; ao trocar de aba, elas são limpas.
      if (type != null && type != _type) {
        _type = type;
        _filters = _filters.copyWith(categories: []);
      }

      if (filters != null) _filters = filters;

      _entries = null;
    });

    _load();
  }

  List<Category> get _typeCategories => _categories.where((category) => category.type == _type).toList();

  Future<void> _openFilters() async {
    final result = await pushPanel<PeriodFilters>(
      context,
      (_) => PeriodFilterPanel(
        title: 'Filtrar ${_type.plural.toLowerCase()}',
        description: 'Escolha o período e as categorias das ${_type.plural.toLowerCase()} exibidas.',
        initial: _filters,
        groups: [CategoryGroup(null, _typeCategories)],
        emptyMessage: 'Nenhuma categoria de ${_type.plural.toLowerCase()} cadastrada.',
      ),
    );

    if (result != null) _apply(filters: result);
  }

  Future<void> _openForm([FinanceEntry? entry]) async {
    final saved = await showFormSheet<bool>(
      context,
      (_) => FinanceFormSheet(type: _type, categories: _typeCategories, entry: entry),
    );

    if (saved == true) _load();
  }

  Future<void> _delete(FinanceEntry entry) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Excluir ${_type.singular}?',
      description: 'A ${_type.singular} "${entry.title}" de ${formatCurrency(entry.amount)} será excluída. '
          'Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
    );

    if (!confirmed || !mounted) return;

    try {
      await FinanceService.delete(_type, entry.id);
      if (!mounted) return;
      showMessage(context, '${capitalize(_type.singular)} excluída.');
      _load();
    } on ApiException catch (error) {
      if (mounted) showMessage(context, error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null && _entries == null) {
      return ErrorView.failure(onRetry: _load, note: _error!.message);
    }

    final names = {for (final category in _categories) category.id: category.name};

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
        children: [
          const ScreenHeader(title: 'Finanças', subtitle: 'Gerencie as despesas e receitas da família.'),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: PeriodNavigator(filters: _filters, onChanged: (filters) => _apply(filters: filters))),
              const SizedBox(width: 8),
              FilterIconButton(activeCount: _filters.categories.length, onPressed: _openFilters),
            ],
          ),
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: () => _openForm(),
            icon: const Icon(LucideIcons.plus, size: 16),
            label: Text('Nova ${_type.singular}'),
          ),
          if (_filters.categories.isNotEmpty) ...[
            const SizedBox(height: 16),
            ActiveFilterChips(
              filters: [
                for (final id in _filters.categories)
                  ActiveFilter(
                    names[id] ?? 'Categoria',
                    () => _apply(filters: _filters.copyWith(categories: [..._filters.categories]..remove(id))),
                  ),
              ],
              onClear: () => _apply(filters: _filters.copyWith(categories: [])),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              for (final (index, type) in EntryType.values.indexed) ...[
                if (index > 0) const SizedBox(width: 12),
                Expanded(
                  child: _TypeTab(
                    type: type,
                    selected: type == _type,
                    total: _summary == null
                        ? null
                        : type == EntryType.expense
                            ? _summary!.expense
                            : _summary!.income,
                    onTap: () => _apply(type: type),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),
          _EntryList(
            type: _type,
            entries: _entries,
            currentUserId: AppScope.of(context).session.user.id,
            onEdit: _openForm,
            onDelete: _delete,
          ),
        ],
      ),
    );
  }
}

class _TypeTab extends StatelessWidget {
  const _TypeTab({required this.type, required this.selected, required this.total, required this.onTap});

  final EntryType type;
  final bool selected;
  final double? total;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Semantics(
      selected: selected,
      button: true,
      child: Material(
        color: colors.card,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: selected ? AppColors.primary : colors.border, width: selected ? 2 : 1),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  type.plural,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: colors.mutedForeground),
                ),
                const SizedBox(height: 2),
                total == null
                    ? const Padding(padding: EdgeInsets.symmetric(vertical: 4), child: Skeleton(height: 20, width: 96))
                    : FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          formatCurrency(total!),
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, fontFeatures: _tabular),
                        ),
                      ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _EntryList extends StatelessWidget {
  const _EntryList({
    required this.type,
    required this.entries,
    required this.currentUserId,
    required this.onEdit,
    required this.onDelete,
  });

  final EntryType type;
  final List<FinanceEntry>? entries;
  final int currentUserId;
  final ValueChanged<FinanceEntry> onEdit;
  final ValueChanged<FinanceEntry> onDelete;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final items = entries;
    final total = items?.fold<double>(0, (sum, entry) => sum + entry.amount) ?? 0;
    final income = type == EntryType.income;

    return AppCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            height: 40,
            padding: const EdgeInsets.only(left: 12, right: 56),
            child: Row(
              children: [
                Expanded(child: Text('Movimentação', style: TextStyle(fontSize: 14, color: colors.mutedForeground))),
                Text('Valor', style: TextStyle(fontSize: 14, color: colors.mutedForeground)),
              ],
            ),
          ),
          if (items == null)
            for (var index = 0; index < 4; index++) ...[
              const RowDivider(),
              const Padding(padding: EdgeInsets.all(12), child: Skeleton(height: 40)),
            ],
          if (items != null && items.isEmpty) ...[
            const RowDivider(),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
              child: Text(
                'Nenhuma ${type.singular} no período.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: colors.mutedForeground),
              ),
            ),
          ],
          for (final entry in items ?? const <FinanceEntry>[]) ...[
            const RowDivider(),
            Padding(
              padding: const EdgeInsets.only(left: 12, top: 10, bottom: 10),
              child: Row(
                children: [
                  EntryIcon(type: type),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                entry.title,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${income ? '+' : '−'}${formatCurrency(entry.amount)}',
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
                          [
                            entry.hasDescription ? entry.category.name : 'Sem observação',
                            formatDayMonthYear(entry.date),
                            if (entry.createdBy != null)
                              entry.createdBy!.id == currentUserId ? 'Você' : getFirstName(entry.createdBy!.name),
                          ].join(' · '),
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 12, color: colors.mutedForeground),
                        ),
                      ],
                    ),
                  ),
                  // Só quem registrou pode alterar ou remover; o backend também bloqueia.
                  if (entry.createdBy?.id == currentUserId)
                    ActionMenuButton(
                      tooltip: 'Ações de ${entry.title}',
                      items: [
                        ActionItem('Editar', () => onEdit(entry)),
                        ActionItem('Excluir', () => onDelete(entry), destructive: true),
                      ],
                    )
                  else
                    const LockIndicator(reason: 'Apenas quem registrou pode editar ou excluir'),
                ],
              ),
            ),
          ],
          if (items != null && items.isNotEmpty) ...[
            const RowDivider(),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '${items.length} ${items.length == 1 ? type.singular : '${type.singular}s'}',
                      style: TextStyle(fontSize: 14, color: colors.mutedForeground),
                    ),
                  ),
                  Text.rich(
                    TextSpan(
                      text: 'Total ',
                      children: [
                        TextSpan(
                          text: formatCurrency(total),
                          style: TextStyle(fontWeight: FontWeight.w600, color: colors.foreground),
                        ),
                      ],
                    ),
                    style: TextStyle(fontSize: 14, color: colors.mutedForeground, fontFeatures: _tabular),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
