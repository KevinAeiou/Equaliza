import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../models/finance.dart';
import '../theme/app_colors.dart';
import '../utils/formatters.dart';
import '../utils/period.dart';
import 'form_fields.dart';
import 'overlays.dart';

/// Setas para voltar e avançar o período, com o rótulo no meio.
class PeriodNavigator extends StatelessWidget {
  const PeriodNavigator({super.key, required this.filters, required this.onChanged});

  final PeriodFilters filters;
  final ValueChanged<PeriodFilters> onChanged;

  void _move(int step) =>
      onChanged(filters.copyWith(period: shiftPeriod(filters.type, filters.period, step)));

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: colors.card,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: [
          IconButton(
            tooltip: 'Período anterior',
            onPressed: () => _move(-1),
            icon: const Icon(LucideIcons.chevronLeft, size: 16),
          ),
          Expanded(
            child: Text(
              formatPeriodLabel(filters.type, filters.period),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                fontFeatures: [FontFeature.tabularFigures()],
              ),
            ),
          ),
          IconButton(
            tooltip: 'Próximo período',
            onPressed: () => _move(1),
            icon: const Icon(LucideIcons.chevronRight, size: 16),
          ),
        ],
      ),
    );
  }
}

/// Botão de filtros só com ícone e a contagem de filtros ativos.
class FilterIconButton extends StatelessWidget {
  const FilterIconButton({super.key, required this.activeCount, required this.onPressed});

  final int activeCount;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => SizedBox(
        width: 44,
        height: 44,
        child: Badge(
          isLabelVisible: activeCount > 0,
          label: Text('$activeCount'),
          backgroundColor: AppColors.primary,
          textColor: Colors.white,
          child: OutlinedButton(
            onPressed: onPressed,
            style: OutlinedButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(44, 44)),
            child: Semantics(
              label: activeCount > 0 ? 'Filtros, $activeCount ativos' : 'Filtros',
              child: const Icon(LucideIcons.slidersHorizontal, size: 16),
            ),
          ),
        ),
      );
}

class ActiveFilter {
  const ActiveFilter(this.label, this.onRemove);

  final String label;
  final VoidCallback onRemove;
}

/// Filtros aplicados, cada um removível, e o atalho para limpar todos.
class ActiveFilterChips extends StatelessWidget {
  const ActiveFilterChips({super.key, required this.filters, required this.onClear});

  final List<ActiveFilter> filters;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    if (filters.isEmpty) return const SizedBox.shrink();

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        for (final filter in filters)
          Material(
            color: colors.card,
            shape: StadiumBorder(side: BorderSide(color: colors.border)),
            child: InkWell(
              customBorder: const StadiumBorder(),
              onTap: filter.onRemove,
              child: Container(
                height: 36,
                padding: const EdgeInsets.only(left: 12, right: 8),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(filter.label, style: const TextStyle(fontSize: 14)),
                    const SizedBox(width: 6),
                    Icon(LucideIcons.x, size: 14, color: colors.mutedForeground, semanticLabel: 'Remover filtro'),
                  ],
                ),
              ),
            ),
          ),
        TextButton(
          onPressed: onClear,
          style: TextButton.styleFrom(foregroundColor: colors.mutedForeground),
          child: const Text(
            'Limpar filtros',
            style: TextStyle(decoration: TextDecoration.underline, fontWeight: FontWeight.w400),
          ),
        ),
      ],
    );
  }
}

class CategoryGroup {
  const CategoryGroup(this.label, this.categories);

  final String? label;
  final List<Category> categories;
}

/// Painel de filtros com período e categorias, usado no dashboard e em finanças.
class PeriodFilterPanel extends StatefulWidget {
  const PeriodFilterPanel({
    super.key,
    required this.title,
    required this.description,
    required this.initial,
    required this.groups,
    this.emptyMessage = 'Nenhuma categoria cadastrada.',
  });

  final String title;
  final String description;
  final PeriodFilters initial;
  final List<CategoryGroup> groups;
  final String emptyMessage;

  @override
  State<PeriodFilterPanel> createState() => _PeriodFilterPanelState();
}

class _PeriodFilterPanelState extends State<PeriodFilterPanel> {
  late PeriodFilters _filters = widget.initial;

  void _setType(PeriodType type) => setState(() {
        _filters = _filters.copyWith(
          type: type,
          period: type == PeriodType.range ? _filters.period : periodFor(type, _filters.period.from),
        );
      });

  void _toggle(int id) => setState(() {
        final selected = [..._filters.categories];
        selected.contains(id) ? selected.remove(id) : selected.add(id);
        _filters = _filters.copyWith(categories: selected);
      });

  Future<void> _pickPeriod() async {
    final picked = await pickPeriod(context, _filters.type, _filters.period);

    if (picked != null) setState(() => _filters = _filters.copyWith(period: picked));
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final selected = _filters.categories.length;
    final hasCategories = widget.groups.any((group) => group.categories.isNotEmpty);

    return FullScreenPanel(
      title: widget.title,
      description: widget.description,
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          FilterSection(
            title: 'Período',
            children: [
              SegmentedControl(
                fontSize: 13,
                options: [for (final type in PeriodType.values) SegmentOption(type, type.label)],
                value: _filters.type,
                onChanged: _setType,
              ),
              LabeledField(
                label: _filters.type == PeriodType.range ? 'De – até' : _filters.type.label,
                child: PickerField(
                  icon: LucideIcons.calendar,
                  value: formatPeriodLabel(_filters.type, _filters.period),
                  onTap: _pickPeriod,
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          FilterSection(
            title: 'Categorias',
            hint: selected == 0 ? null : '$selected selecionada${selected > 1 ? 's' : ''}',
            children: [
              if (!hasCategories)
                Text(widget.emptyMessage, style: TextStyle(fontSize: 14, color: colors.mutedForeground))
              else ...[
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    SelectChip(
                      label: 'Todas',
                      selected: selected == 0,
                      onTap: () => setState(() => _filters = _filters.copyWith(categories: [])),
                    ),
                  ],
                ),
                for (final group in widget.groups)
                  if (group.categories.isNotEmpty)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (group.label != null) ...[
                          Text(
                            group.label!,
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: colors.mutedForeground),
                          ),
                          const SizedBox(height: 8),
                        ],
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            for (final category in group.categories)
                              SelectChip(
                                label: category.name,
                                selected: _filters.categories.contains(category.id),
                                onTap: () => _toggle(category.id),
                              ),
                          ],
                        ),
                      ],
                    ),
              ],
            ],
          ),
        ],
      ),
      footer: SheetFooter(
        background: false,
        children: [
          OutlinedButton(
            onPressed: () => Navigator.pop(context, PeriodFilters.initial()),
            child: const Text('Limpar filtros'),
          ),
          FilledButton(onPressed: () => Navigator.pop(context, _filters), child: const Text('Aplicar')),
        ],
      ),
    );
  }
}

/// Abre o seletor adequado ao tipo de período.
Future<Period?> pickPeriod(BuildContext context, PeriodType type, Period current) async {
  final first = DateTime(2000);
  final last = DateTime(2100);

  switch (type) {
    case PeriodType.day:
    case PeriodType.week:
      final date = await showDatePicker(
        context: context,
        initialDate: current.from,
        firstDate: first,
        lastDate: last,
        helpText: type == PeriodType.week ? 'Escolha um dia da semana' : 'Escolha o dia',
      );
      return date == null ? null : periodFor(type, date);
    case PeriodType.range:
      final range = await showDateRangePicker(
        context: context,
        initialDateRange: DateTimeRange(start: current.from, end: current.to),
        firstDate: first,
        lastDate: last,
      );
      return range == null ? null : Period(range.start, range.end);
    case PeriodType.month:
      final month = await showDialog<DateTime>(
        context: context,
        builder: (_) => _MonthPickerDialog(initial: current.from),
      );
      return month == null ? null : periodFor(type, month);
    case PeriodType.year:
      final year = await showDialog<int>(
        context: context,
        builder: (_) => _YearPickerDialog(initial: current.from.year),
      );
      return year == null ? null : periodFor(type, DateTime(year));
  }
}

class _MonthPickerDialog extends StatefulWidget {
  const _MonthPickerDialog({required this.initial});

  final DateTime initial;

  @override
  State<_MonthPickerDialog> createState() => _MonthPickerDialogState();
}

class _MonthPickerDialogState extends State<_MonthPickerDialog> {
  late int _year = widget.initial.year;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Dialog(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                IconButton(
                  tooltip: 'Ano anterior',
                  onPressed: () => setState(() => _year--),
                  icon: const Icon(LucideIcons.chevronLeft, size: 16),
                ),
                Expanded(
                  child: Text(
                    '$_year',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ),
                IconButton(
                  tooltip: 'Próximo ano',
                  onPressed: () => setState(() => _year++),
                  icon: const Icon(LucideIcons.chevronRight, size: 16),
                ),
              ],
            ),
            const SizedBox(height: 8),
            GridView.count(
              shrinkWrap: true,
              crossAxisCount: 3,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 2.2,
              children: [
                for (var month = 1; month <= 12; month++)
                  _PickerCell(
                    label: capitalize(DateFormat('MMM', 'pt_BR').format(DateTime(_year, month)).replaceAll('.', '')),
                    selected: _year == widget.initial.year && month == widget.initial.month,
                    onTap: () => Navigator.pop(context, DateTime(_year, month)),
                    colors: colors,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _YearPickerDialog extends StatelessWidget {
  const _YearPickerDialog({required this.initial});

  final int initial;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final years = [for (var year = initial - 7; year <= initial + 4; year++) year];

    return Dialog(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: GridView.count(
          shrinkWrap: true,
          crossAxisCount: 3,
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          childAspectRatio: 2.2,
          children: [
            for (final year in years)
              _PickerCell(
                label: '$year',
                selected: year == initial,
                onTap: () => Navigator.pop(context, year),
                colors: colors,
              ),
          ],
        ),
      ),
    );
  }
}

class _PickerCell extends StatelessWidget {
  const _PickerCell({required this.label, required this.selected, required this.onTap, required this.colors});

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final AppColors colors;

  @override
  Widget build(BuildContext context) => Material(
        color: selected ? AppColors.primary : colors.muted,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Center(
            child: Text(
              label,
              style: TextStyle(fontWeight: FontWeight.w500, color: selected ? Colors.white : colors.foreground),
            ),
          ),
        ),
      );
}
