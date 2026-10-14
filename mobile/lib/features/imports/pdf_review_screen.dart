import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/overlays.dart';
import '../../models/pending.dart';
import 'imports_service.dart';

String _money(double? value) => value == null ? '—' : formatCurrency(value);

/// Revisão obrigatória do extrato em PDF: as linhas são lidas por heurística, então nada é gravado
/// antes de o usuário conferir. Retorna o lote criado, ou nulo se cancelado.
class PdfReviewScreen extends StatefulWidget {
  const PdfReviewScreen({super.key, required this.preview});

  final PdfPreview preview;

  @override
  State<PdfReviewScreen> createState() => _PdfReviewScreenState();
}

class _PdfReviewScreenState extends State<PdfReviewScreen> {
  late final List<StatementRow> _rows = List.of(widget.preview.rows);
  bool _acknowledged = false;
  bool _loading = false;

  bool get _edited =>
      _rows.length != widget.preview.rows.length ||
      Iterable<int>.generate(_rows.length).any((i) => _rows[i].description != widget.preview.rows[i].description);

  /// Com totais que não conferem (ou linhas alteradas) a confirmação é explícita.
  bool get _needsAck => widget.preview.matches != true || _edited;

  Future<void> _editDescription(int index) async {
    final controller = TextEditingController(text: _rows[index].description);

    final value = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Descrição'),
        content: TextField(controller: controller, maxLength: 500, autofocus: true, textCapitalization: TextCapitalization.sentences),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(context, controller.text.trim()), child: const Text('Salvar')),
        ],
      ),
    );

    controller.dispose();

    if (value != null) setState(() => _rows[index] = _rows[index].withDescription(value));
  }

  Future<void> _confirm() async {
    final navigator = Navigator.of(context);

    setState(() => _loading = true);

    try {
      final batch = await ImportsService.confirmPdf(_rows, widget.preview.accountRef);

      navigator.pop(batch);
    } on ApiException catch (error) {
      if (!mounted) return;

      setState(() => _loading = false);
      showMessage(context, error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final preview = widget.preview;
    final matches = preview.matches;

    return FullScreenPanel(
      title: 'Revise o extrato',
      description: '${formatShortDate(preview.periodStart)} a ${formatShortDate(preview.periodEnd)} · ${_rows.length} linha(s). Nada foi gravado ainda.',
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          AppCard(
            color: matches == true ? colors.incomeSoft : colors.muted,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(matches == true ? LucideIcons.circleCheck : LucideIcons.triangleAlert, size: 18, color: matches == true ? colors.income : colors.expenseStrong),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        switch (matches) {
                          true => 'Os totais lidos conferem com os do extrato.',
                          false => 'Os totais lidos não batem com os do extrato. Alguma linha pode ter ficado de fora ou ter sido lida errado.',
                          null => 'O PDF não traz totais para conferir. Confira as linhas com atenção.',
                        },
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Lido: entradas ${_money(preview.parsedIn)} · saídas ${_money(preview.parsedOut)}'
                        '${matches == null ? '' : '\nExtrato: entradas ${_money(preview.pdfIn)} · saídas ${_money(preview.pdfOut)}'}',
                        style: TextStyle(fontSize: 12, color: colors.mutedForeground),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          for (var i = 0; i < _rows.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: AppCard(
                padding: const EdgeInsets.fromLTRB(14, 10, 4, 10),
                onTap: () => _editDescription(i),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // O texto vem do PDF: é exibido como texto puro.
                          Text(_rows[i].description, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w500)),
                          Text(formatShortDate(_rows[i].date), style: TextStyle(fontSize: 12, color: colors.mutedForeground)),
                        ],
                      ),
                    ),
                    Text(
                      '${_rows[i].isCredit ? '+ ' : ''}${formatCurrency(_rows[i].amount)}',
                      style: TextStyle(fontWeight: FontWeight.w600, color: _rows[i].isCredit ? colors.income : null),
                    ),
                    IconButton(
                      tooltip: 'Remover linha',
                      icon: const Icon(LucideIcons.trash2, size: 18),
                      onPressed: () => setState(() => _rows.removeAt(i)),
                    ),
                  ],
                ),
              ),
            ),
          if (_needsAck)
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              value: _acknowledged,
              onChanged: (value) => setState(() => _acknowledged = value ?? false),
              title: Text(
                'Conferi as linhas e quero importar${matches == true ? '' : ' mesmo com a diferença nos totais'}.',
                style: const TextStyle(fontSize: 14),
              ),
            ),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: _loading || _rows.isEmpty || (_needsAck && !_acknowledged) ? null : _confirm,
            child: Text(_loading ? 'Importando...' : 'Importar ${_rows.length} linha(s)'),
          ),
          const SizedBox(height: 8),
          OutlinedButton(onPressed: _loading ? null : () => Navigator.pop(context), child: const Text('Cancelar')),
        ],
      ),
    );
  }
}
