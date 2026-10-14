import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/form_fields.dart';
import '../../core/widgets/overlays.dart';
import '../../models/pending.dart';
import 'imports_service.dart';
import 'mapping_sheet.dart';

/// Mesmo limite do servidor (5 MB); o servidor confere de novo.
const maxImportBytes = 5 * 1024 * 1024;

String batchLabel(ImportBatch batch) {
  final period = batch.periodStart != null && batch.periodEnd != null
      ? '${formatDayMonth(batch.periodStart!)} a ${formatDayMonth(batch.periodEnd!)}'
      : 'sem período';

  return '${batch.source == ImportSource.cardInvoice ? 'Fatura' : 'Extrato'} · $period · ${batch.pendingCount} pendente(s)';
}

/// Envio de extrato ou fatura (OFX, CSV ou ZIP com senha). O arquivo vai direto da memória para a API
/// e a cópia temporária do seletor é apagada logo depois.
class ImportScreen extends StatefulWidget {
  const ImportScreen({super.key});

  @override
  State<ImportScreen> createState() => _ImportScreenState();
}

class _ImportScreenState extends State<ImportScreen> {
  final _password = TextEditingController();
  ImportSource _source = ImportSource.statement;
  String? _filename;
  Uint8List? _bytes;
  bool _passwordNeeded = false;
  bool _uploading = false;
  int? _mapping;
  List<CsvMapping> _mappings = [];
  List<ImportBatch> _batches = [];
  ImportBatch? _result;

  @override
  void initState() {
    super.initState();
    _loadBatches();
    ImportsService.mappings().then((value) {
      if (mounted) setState(() => _mappings = value);
    }).catchError((_) {});
  }

  @override
  void dispose() {
    _password.dispose();
    super.dispose();
  }

  Future<void> _loadBatches() async {
    try {
      final batches = await ImportsService.batches();
      if (mounted) setState(() => _batches = batches);
    } catch (_) {
      // O histórico fica vazio.
    }
  }

  Future<void> _pick() async {
    final file = await FilePicker.pickFile(type: FileType.custom, allowedExtensions: ['ofx', 'csv', 'zip']);

    if (file == null || !mounted) return;

    if ((await file.length() ?? 0) > maxImportBytes) {
      if (mounted) showMessage(context, 'Arquivo grande demais (máximo de 5 MB).');
      return;
    }

    final bytes = await file.readAsBytes();

    if (!mounted) return;

    setState(() {
      _filename = file.name;
      _bytes = bytes;
      _result = null;
      _passwordNeeded = false;
      _password.clear();
    });
  }

  Future<void> _upload([int? mapping]) async {
    final bytes = _bytes;

    if (bytes == null || _filename == null) return;

    setState(() => _uploading = true);

    try {
      final batch = await ImportsService.upload(
        bytes: bytes,
        filename: _filename!,
        source: _source,
        password: _password.text,
        mapping: mapping ?? _mapping,
      );

      // A cópia temporária do seletor e os bytes em memória não são mais necessários.
      FilePicker.clearTemporaryFiles().catchError((_) {});
      ImportsService.refreshCount();

      if (!mounted) return;

      setState(() {
        _result = batch;
        _bytes = null;
        _filename = null;
        _passwordNeeded = false;
        _password.clear();
      });
      _loadBatches();
    } on ApiException catch (error) {
      if (!mounted) return;

      if (error.code == 'needs_mapping') {
        await _openMapping(error.headers);
        return;
      }

      if (error.code == 'password_required' || error.code == 'wrong_password') {
        setState(() => _passwordNeeded = true);
      }

      showMessage(context, error.message);
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _openMapping(List<String> headers) async {
    final mapping = await showFormSheet<CsvMapping>(context, (_) => MappingSheet(headers: headers));

    if (mapping == null || !mounted) return;

    setState(() {
      _mappings = [..._mappings, mapping];
      _mapping = mapping.id;
    });

    await _upload(mapping.id);
  }

  Future<void> _removeBatch(ImportBatch batch) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Remover importação?',
      description: 'As pendências ainda não tratadas deste arquivo saem da lista. As despesas já registradas continuam em Finanças.',
      confirmLabel: 'Remover',
    );

    if (!confirmed || !mounted) return;

    try {
      await ImportsService.deleteBatch(batch.id);
      ImportsService.refreshCount();
      _loadBatches();
    } on ApiException catch (error) {
      if (mounted) showMessage(context, error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return FullScreenPanel(
      title: 'Importar arquivo',
      description: 'Envie o extrato ou a fatura baixados no app do seu banco (OFX ou CSV).',
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
        children: [
          SegmentedControl<ImportSource>(
            options: [for (final source in ImportSource.values) SegmentOption(source, source.label)],
            value: _source,
            onChanged: (value) => setState(() => _source = value),
          ),
          const SizedBox(height: 16),
          AppCard(
            child: Column(
              children: [
                Icon(LucideIcons.fileUp, size: 32, color: colors.mutedForeground),
                const SizedBox(height: 8),
                Text(
                  _filename ?? 'Nenhum arquivo escolhido.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: _filename == null ? colors.mutedForeground : null, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 12),
                OutlinedButton(onPressed: _uploading ? null : _pick, child: const Text('Escolher arquivo')),
              ],
            ),
          ),
          const SizedBox(height: 16),
          PasswordField(
            label: _passwordNeeded ? 'Senha do arquivo (obrigatória)' : 'Senha do arquivo (só se houver, como a fatura do C6)',
            controller: _password,
            autofillHints: const [],
          ),
          if (_mappings.isNotEmpty) ...[
            const SizedBox(height: 16),
            LabeledField(
              label: 'Modelo do CSV',
              child: PickerField(
                value: _mappings.where((mapping) => mapping.id == _mapping).firstOrNull?.name ?? 'Automático (OFX ou CSV de Nubank e C6)',
                onTap: () async {
                  final choice = await showModalBottomSheet<int>(
                    context: context,
                    builder: (context) => SafeArea(
                      child: ListView(
                        shrinkWrap: true,
                        children: [
                          ListTile(title: const Text('Automático'), onTap: () => Navigator.pop(context, 0)),
                          for (final mapping in _mappings)
                            ListTile(title: Text(mapping.name), onTap: () => Navigator.pop(context, mapping.id)),
                        ],
                      ),
                    ),
                  );

                  if (choice != null) setState(() => _mapping = choice == 0 ? null : choice);
                },
              ),
            ),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _bytes == null || _uploading ? null : _upload,
            child: Text(_uploading ? 'Enviando...' : 'Importar'),
          ),
          const SizedBox(height: 12),
          Text(
            'O arquivo é lido na hora e não é guardado. Só ficam as linhas, por até 60 dias, e a descrição é guardada cifrada. '
            'Apague o arquivo da pasta de downloads depois do envio.',
            style: TextStyle(fontSize: 12, color: colors.mutedForeground),
          ),
          if (_result != null) ...[
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Importação concluída', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(
                    '${_result!.rowsNew} nova(s) · ${_result!.rowsDuplicated} já importada(s)',
                    style: TextStyle(color: colors.mutedForeground),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(onPressed: () => Navigator.pop(context), child: const Text('Ver pendências')),
                ],
              ),
            ),
          ],
          if (_batches.isNotEmpty) ...[
            const SizedBox(height: 24),
            const Text('Importações anteriores', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  for (final batch in _batches)
                    ListTile(
                      title: Text(batchLabel(batch), style: const TextStyle(fontSize: 14)),
                      trailing: IconButton(
                        tooltip: 'Remover importação',
                        icon: const Icon(LucideIcons.trash2, size: 18),
                        onPressed: () => _removeBatch(batch),
                      ),
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
