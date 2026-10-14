import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/security/biometric_service.dart';
import '../../core/security/screen_security.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/error_view.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/overlays.dart';
import '../../models/finance.dart';
import '../../models/pending.dart';
import '../category/category_service.dart';
import 'import_screen.dart';
import 'imports_service.dart';
import 'register_pending_sheet.dart';

const _tabular = [FontFeature.tabularFigures()];

/// Pendências dos extratos e faturas importados. A tela exige biometria (quando o aparelho tem),
/// bloqueia capturas de tela e volta a travar quando o app vai para segundo plano.
class PendingScreen extends StatefulWidget {
  const PendingScreen({super.key});

  @override
  State<PendingScreen> createState() => _PendingScreenState();
}

class _PendingScreenState extends State<PendingScreen> with WidgetsBindingObserver {
  PendingDirection? _direction;
  bool _cardPaymentsOnly = false;
  List<Category> _categories = [];
  List<PendingTransaction>? _items;
  final Set<int> _selected = {};
  ApiException? _error;
  bool _unlocked = false;
  bool _authenticating = false;
  int _request = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    ScreenSecurity.enable();
    _unlock();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    ScreenSecurity.disable();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Ao sair do app a lista é escondida; ao voltar, pede a biometria de novo.
    if (state == AppLifecycleState.paused || state == AppLifecycleState.hidden) {
      setState(() {
        _unlocked = false;
        _items = null;
        _selected.clear();
      });
    } else if (state == AppLifecycleState.resumed && !_unlocked) {
      _unlock();
    }
  }

  Future<void> _unlock() async {
    if (_authenticating) return;

    _authenticating = true;

    // Sem biometria cadastrada o aparelho não tem como confirmar; a sessão do app já protege a tela.
    final ok = !await BiometricService.isAvailable() || await BiometricService.authenticate('Confirme para ver suas pendências');

    _authenticating = false;

    if (!mounted) return;

    setState(() => _unlocked = ok);

    if (ok) {
      _loadCategories();
      _load();
    }
  }

  Future<void> _loadCategories() async {
    try {
      final categories = await CategoryService.list(type: EntryType.expense);
      if (mounted) setState(() => _categories = categories);
    } catch (_) {
      // O formulário mostra a lista de categorias vazia.
    }
  }

  Future<void> _load() async {
    final request = ++_request;

    setState(() => _error = null);

    try {
      final items = await ImportsService.list(direction: _direction, cardPaymentsOnly: _cardPaymentsOnly);

      if (!mounted || request != _request) return;

      setState(() {
        _items = items;
        _selected.removeWhere((id) => !items.any((item) => item.id == id));
      });
    } on ApiException catch (error) {
      if (mounted && request == _request) setState(() => _error = error);
    }
  }

  void _filter({PendingDirection? direction, bool? cardPaymentsOnly, bool clearDirection = false}) {
    setState(() {
      if (clearDirection) _direction = null;
      if (direction != null) _direction = direction;
      if (cardPaymentsOnly != null) _cardPaymentsOnly = cardPaymentsOnly;
      _items = null;
      _selected.clear();
    });

    _load();
  }

  void _reload() {
    _load();
    ImportsService.refreshCount();
  }

  Future<void> _register({PendingTransaction? pending}) async {
    final saved = await showFormSheet<bool>(
      context,
      (_) => RegisterPendingSheet(
        categories: _categories,
        pending: pending,
        ids: pending == null ? _selected.toList() : const [],
      ),
    );

    if (saved == true) _reload();
  }

  Future<void> _dismiss(List<int> ids) async {
    final confirmed = await showConfirmDialog(
      context,
      title: ids.length == 1 ? 'Marcar como lida?' : 'Marcar ${ids.length} como lidas?',
      description: 'Elas saem da lista e a descrição é apagada. Reenviar o mesmo arquivo não as traz de volta.',
      confirmLabel: 'Marcar como lida',
      icon: LucideIcons.eyeOff,
    );

    if (!confirmed || !mounted) return;

    try {
      await ImportsService.bulk(ids, register: false);
      if (!mounted) return;
      showMessage(context, 'Marcadas como lidas.');
      _reload();
    } on ApiException catch (error) {
      if (mounted) showMessage(context, error.message);
    }
  }

  Future<void> _openImport() async {
    await pushPanel<void>(context, (_) => const ImportScreen());

    if (mounted) _reload();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    if (!_unlocked) {
      return ListView(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
        children: [
          const ScreenHeader(title: 'Pendências', subtitle: 'Linhas dos extratos e faturas que você enviou.'),
          const SizedBox(height: 16),
          EmptyCard(
            title: 'Conteúdo protegido',
            description: 'Confirme sua identidade para ver as pendências.',
            action: FilledButton.icon(
              onPressed: _unlock,
              icon: const Icon(LucideIcons.lockKeyhole, size: 16),
              label: const Text('Desbloquear'),
            ),
          ),
        ],
      );
    }

    if (_error != null && _items == null) return ErrorView.failure(onRetry: _load, note: _error!.message);

    final items = _items;
    final selected = items?.where((item) => _selected.contains(item.id)).toList() ?? const <PendingTransaction>[];
    final hasCredit = selected.any((item) => item.isCredit);

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
        children: [
          const ScreenHeader(
            title: 'Pendências',
            subtitle: 'Registre como despesa ou marque como lidas as linhas dos seus extratos e faturas.',
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _openImport,
            icon: const Icon(LucideIcons.upload, size: 16),
            label: const Text('Importar arquivo'),
          ),
          const SizedBox(height: 12),
          SegmentedControl<PendingDirection?>(
            options: const [
              SegmentOption(null, 'Todas'),
              SegmentOption(PendingDirection.debit, 'Débitos'),
              SegmentOption(PendingDirection.credit, 'Créditos'),
            ],
            value: _direction,
            onChanged: (value) => value == null ? _filter(clearDirection: true) : _filter(direction: value),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: SelectChip(
              label: 'Só pagamentos de fatura',
              selected: _cardPaymentsOnly,
              onTap: () => _filter(cardPaymentsOnly: !_cardPaymentsOnly),
            ),
          ),
          if (_selected.isNotEmpty) ...[
            const SizedBox(height: 12),
            AppCard(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${_selected.length} selecionada(s)', style: const TextStyle(fontWeight: FontWeight.w600)),
                  if (hasCredit)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        'Créditos só podem ser marcados como lidos.',
                        style: TextStyle(fontSize: 12, color: colors.mutedForeground),
                      ),
                    ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: FilledButton(
                          onPressed: hasCredit ? null : () => _register(),
                          child: const Text('Registrar'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => _dismiss(_selected.toList()),
                          child: const Text('Marcar como lidas'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 12),
          if (items == null)
            for (var i = 0; i < 4; i++) const Padding(padding: EdgeInsets.only(bottom: 8), child: Skeleton(height: 84, radius: 14))
          else if (items.isEmpty)
            const EmptyCard(
              title: 'Nenhuma pendência.',
              description: 'Envie um extrato ou uma fatura para começar.',
            )
          else ...[
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton(
                onPressed: () => setState(() {
                  if (_selected.length == items.length) {
                    _selected.clear();
                  } else {
                    _selected.addAll(items.map((item) => item.id));
                  }
                }),
                child: Text(_selected.length == items.length ? 'Limpar seleção' : 'Selecionar todas'),
              ),
            ),
            for (final item in items)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _PendingCard(
                  item: item,
                  selected: _selected.contains(item.id),
                  onToggle: () => setState(() => _selected.contains(item.id) ? _selected.remove(item.id) : _selected.add(item.id)),
                  onRegister: () => _register(pending: item),
                  onDismiss: () => _dismiss([item.id]),
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _PendingCard extends StatelessWidget {
  const _PendingCard({
    required this.item,
    required this.selected,
    required this.onToggle,
    required this.onRegister,
    required this.onDismiss,
  });

  final PendingTransaction item;
  final bool selected;
  final VoidCallback onToggle;
  final VoidCallback onRegister;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return AppCard(
      padding: const EdgeInsets.fromLTRB(8, 12, 14, 8),
      highlighted: selected,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Checkbox(value: selected, onChanged: (_) => onToggle()),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // O texto vem do banco: é exibido como texto puro.
                    Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w500)),
                    const SizedBox(height: 2),
                    Text(formatShortDate(item.date), style: TextStyle(fontSize: 12, color: colors.mutedForeground)),
                    if (item.cardPayment || item.sourceCategory.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: [
                            if (item.cardPayment) const Pill(label: 'Provável pagamento de fatura', bordered: true),
                            if (item.sourceCategory.isNotEmpty) Pill(label: item.sourceCategory, background: colors.muted),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${item.isCredit ? '+ ' : ''}${formatCurrency(item.amount)}',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontFeatures: _tabular,
                  color: item.isCredit ? colors.income : null,
                ),
              ),
            ],
          ),
          Align(
            alignment: Alignment.centerRight,
            child: Wrap(
              children: [
                TextButton(onPressed: onDismiss, child: const Text('Marcar como lida')),
                if (!item.isCredit) TextButton(onPressed: onRegister, child: const Text('Registrar')),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
