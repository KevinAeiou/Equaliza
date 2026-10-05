import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/session/app_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/error_view.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/overlays.dart';
import '../../core/widgets/period_filters.dart';
import '../../models/finance.dart';
import '../../models/user.dart';
import 'category_form_sheet.dart';
import 'category_service.dart';

class CategoryFilters {
  const CategoryFilters({this.name = '', this.type});

  final String name;
  final EntryType? type;

  int get count => (name.trim().isNotEmpty ? 1 : 0) + (type != null ? 1 : 0);
}

class CategoryScreen extends StatefulWidget {
  const CategoryScreen({super.key});

  @override
  State<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends State<CategoryScreen> {
  CategoryFilters _filters = const CategoryFilters();
  List<Category>? _categories;
  ApiException? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);

    try {
      final categories = await CategoryService.list(name: _filters.name, type: _filters.type);
      if (mounted) setState(() => _categories = categories);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error);
    }
  }

  void _apply(CategoryFilters filters) {
    setState(() {
      _filters = filters;
      _categories = null;
    });
    _load();
  }

  Future<void> _openFilters() async {
    final result = await pushPanel<CategoryFilters>(context, (_) => _CategoryFilterPanel(initial: _filters));

    if (result != null) _apply(result);
  }

  Future<void> _openForm([Category? category]) async {
    final result = await showFormSheet<CategoryResult>(context, (_) => CategoryFormSheet(category: category));

    if (!mounted) return;

    if (result == CategoryResult.saved) _load();
    if (result == CategoryResult.delete && category != null) _delete(category);
  }

  Future<void> _delete(Category category) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Excluir ${category.name}?',
      description: 'A categoria será excluída permanentemente. Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
    );

    if (!confirmed || !mounted) return;

    try {
      await CategoryService.delete(category.id);
      if (!mounted) return;
      showMessage(context, 'Categoria excluída.');
      _load();
    } on ApiException catch (error) {
      if (mounted) showMessage(context, error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null && _categories == null) {
      return ErrorView.failure(onRetry: _load, note: _error!.message);
    }

    final role = AppScope.of(context).session.user.role;
    final canManage = role == UserRole.owner || role == UserRole.admin;
    final sections = EntryType.values.reversed.where((type) => _filters.type == null || _filters.type == type);

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
        children: [
          const ScreenHeader(
            title: 'Categorias',
            subtitle: 'Organize as categorias usadas nas despesas e receitas da família.',
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              FilterIconButton(activeCount: _filters.count, onPressed: _openFilters),
              if (canManage) ...[
                const SizedBox(width: 8),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () => _openForm(),
                    icon: const Icon(LucideIcons.plus, size: 16),
                    label: const Text('Nova categoria'),
                  ),
                ),
              ],
            ],
          ),
          if (_filters.count > 0) ...[
            const SizedBox(height: 16),
            ActiveFilterChips(
              filters: [
                if (_filters.name.trim().isNotEmpty)
                  ActiveFilter(
                    'Nome: “${_filters.name.trim()}”',
                    () => _apply(CategoryFilters(type: _filters.type)),
                  ),
                if (_filters.type != null)
                  ActiveFilter(
                    'Tipo: ${_filters.type!.plural}',
                    () => _apply(CategoryFilters(name: _filters.name)),
                  ),
              ],
              onClear: () => _apply(const CategoryFilters()),
            ),
          ],
          for (final type in sections) ...[
            const SizedBox(height: 16),
            _CategorySection(
              type: type,
              categories: _categories?.where((category) => category.type == type).toList(),
              canManage: canManage,
              onEdit: _openForm,
            ),
          ],
        ],
      ),
    );
  }
}

class _CategorySection extends StatelessWidget {
  const _CategorySection({
    required this.type,
    required this.categories,
    required this.canManage,
    required this.onEdit,
  });

  final EntryType type;
  final List<Category>? categories;
  final bool canManage;
  final ValueChanged<Category> onEdit;

  static String? _usage(int? count) {
    if (count == null) return null;
    if (count == 0) return 'Sem lançamentos';

    return '$count ${count == 1 ? 'lançamento' : 'lançamentos'}';
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final items = categories;

    return AppCard(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              EntryIcon(type: type),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(type.plural, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  Text(
                    items == null
                        ? 'Carregando...'
                        : '${items.length} ${items.length == 1 ? 'categoria' : 'categorias'}',
                    style: TextStyle(fontSize: 14, color: colors.mutedForeground),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (items == null) const Padding(padding: EdgeInsets.only(bottom: 12), child: Skeleton(height: 120)),
          if (items != null && items.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Text(
                'Nenhuma categoria encontrada.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: colors.mutedForeground),
              ),
            ),
          for (final (index, category) in (items ?? const <Category>[]).indexed) ...[
            if (index > 0) const RowDivider(),
            Material(
              color: Colors.transparent,
              child: InkWell(
                // Tocar na linha abre a edição (onde também fica o Excluir).
                onTap: category.isDefault || !canManage ? null : () => onEdit(category),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    children: [
                      IconBadge(icon: LucideIcons.tag, background: colors.muted, foreground: colors.mutedForeground),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              category.name,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                            ),
                            Text(
                              category.isDefault ? 'Padrão do sistema' : 'Criada pela família',
                              style: TextStyle(fontSize: 12, color: colors.mutedForeground),
                            ),
                          ],
                        ),
                      ),
                      if (_usage(category.usageCount) != null)
                        Text(
                          _usage(category.usageCount)!,
                          style: TextStyle(fontSize: 12, color: colors.mutedForeground),
                        ),
                      if (category.isDefault || !canManage)
                        Transform.translate(
                          offset: const Offset(12, 0),
                          child: LockIndicator(
                            reason: category.isDefault
                                ? 'Categorias padrão do sistema não podem ser alteradas'
                                : 'Apenas responsáveis e administradores podem alterar categorias',
                          ),
                        )
                      else
                        const SizedBox(width: 32),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _CategoryFilterPanel extends StatefulWidget {
  const _CategoryFilterPanel({required this.initial});

  final CategoryFilters initial;

  @override
  State<_CategoryFilterPanel> createState() => _CategoryFilterPanelState();
}

class _CategoryFilterPanelState extends State<_CategoryFilterPanel> {
  late final _name = TextEditingController(text: widget.initial.name);
  late EntryType? _type = widget.initial.type;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FullScreenPanel(
        title: 'Filtrar categorias',
        description: 'Encontre categorias pelo nome ou pelo tipo.',
        body: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            AppTextField(label: 'Nome', controller: _name, placeholder: 'Ex.: Mercado'),
            const SizedBox(height: 32),
            FilterSection(
              title: 'Tipo',
              children: [
                SegmentedControl<EntryType?>(
                  options: const [
                    SegmentOption(null, 'Todos'),
                    SegmentOption(EntryType.income, 'Receitas'),
                    SegmentOption(EntryType.expense, 'Despesas'),
                  ],
                  value: _type,
                  onChanged: (type) => setState(() => _type = type),
                ),
              ],
            ),
          ],
        ),
        footer: SheetFooter(
          background: false,
          children: [
            OutlinedButton(
              onPressed: () => Navigator.pop(context, const CategoryFilters()),
              child: const Text('Limpar filtros'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, CategoryFilters(name: _name.text, type: _type)),
              child: const Text('Aplicar'),
            ),
          ],
        ),
      );
}
