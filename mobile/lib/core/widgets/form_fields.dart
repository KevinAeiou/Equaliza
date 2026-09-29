import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../theme/app_colors.dart';

/// Rótulo acima do campo, como o `FieldLabel` do web.
class LabeledField extends StatelessWidget {
  const LabeledField({super.key, required this.label, required this.child, this.hint, this.optional = false});

  final String label;
  final Widget child;
  final String? hint;
  final bool optional;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text.rich(
            TextSpan(
              text: label,
              children: [
                if (optional)
                  TextSpan(
                    text: ' (opcional)',
                    style: TextStyle(fontWeight: FontWeight.w400, color: context.colors.mutedForeground),
                  ),
              ],
            ),
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 8),
          child,
          if (hint != null) ...[
            const SizedBox(height: 6),
            Text(hint!, style: TextStyle(fontSize: 12, color: context.colors.mutedForeground)),
          ],
        ],
      );
}

class AppTextField extends StatelessWidget {
  const AppTextField({
    super.key,
    required this.label,
    required this.controller,
    this.placeholder,
    this.keyboardType,
    this.textInputAction,
    this.autofillHints,
    this.validator,
    this.enabled = true,
    this.errorText,
    this.onSubmitted,
    this.textCapitalization = TextCapitalization.none,
    this.icon,
    this.hint,
    this.optional = false,
  });

  final String label;
  final TextEditingController controller;
  final String? placeholder;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final Iterable<String>? autofillHints;
  final FormFieldValidator<String>? validator;
  final bool enabled;
  final String? errorText;
  final ValueChanged<String>? onSubmitted;
  final TextCapitalization textCapitalization;
  final IconData? icon;
  final String? hint;
  final bool optional;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return LabeledField(
      label: label,
      hint: hint,
      optional: optional,
      child: TextFormField(
        controller: controller,
        enabled: enabled,
        keyboardType: keyboardType,
        textInputAction: textInputAction ?? TextInputAction.next,
        autofillHints: autofillHints,
        validator: validator,
        textCapitalization: textCapitalization,
        onFieldSubmitted: onSubmitted,
        style: TextStyle(fontSize: 16, color: enabled ? colors.foreground : colors.mutedForeground),
        decoration: InputDecoration(
          hintText: placeholder,
          errorText: errorText,
          fillColor: enabled ? null : colors.muted,
          prefixIcon: _fieldIcon(context, icon),
        ),
      ),
    );
  }
}

/// Ícone à esquerda do campo, no mesmo tom do placeholder.
Widget? _fieldIcon(BuildContext context, IconData? icon) =>
    icon == null ? null : Icon(icon, size: 18, color: context.colors.mutedForeground);

class PasswordField extends StatefulWidget {
  const PasswordField({
    super.key,
    required this.label,
    required this.controller,
    this.placeholder,
    this.validator,
    this.textInputAction,
    this.onSubmitted,
    this.autofillHints = const [AutofillHints.password],
    this.icon,
    this.footer,
  });

  final String label;
  final TextEditingController controller;
  final String? placeholder;
  final FormFieldValidator<String>? validator;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final Iterable<String> autofillHints;
  final IconData? icon;

  /// Conteúdo abaixo do campo, como a regra de tamanho mínimo da senha.
  final Widget? footer;

  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _visible = false;

  @override
  Widget build(BuildContext context) {
    final field = TextFormField(
      controller: widget.controller,
      obscureText: !_visible,
      validator: widget.validator,
      autofillHints: widget.autofillHints,
      textInputAction: widget.textInputAction ?? TextInputAction.next,
      onFieldSubmitted: widget.onSubmitted,
      style: const TextStyle(fontSize: 16),
      decoration: InputDecoration(
        hintText: widget.placeholder,
        prefixIcon: _fieldIcon(context, widget.icon),
        suffixIcon: IconButton(
          tooltip: _visible ? 'Ocultar senha' : 'Mostrar senha',
          icon: Icon(
            _visible ? LucideIcons.eyeOff : LucideIcons.eye,
            size: 16,
            color: context.colors.mutedForeground,
          ),
          onPressed: () => setState(() => _visible = !_visible),
        ),
      ),
    );

    return LabeledField(
      label: widget.label,
      child: widget.footer == null
          ? field
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [field, const SizedBox(height: 8), widget.footer!],
            ),
    );
  }
}

/// Botão com aparência de campo, que abre um seletor (data, categoria, mês).
class PickerField extends StatelessWidget {
  const PickerField({
    super.key,
    required this.value,
    required this.onTap,
    this.placeholder = 'Selecione',
    this.icon,
    this.errorText,
    this.showChevron = true,
  });

  final String? value;
  final VoidCallback? onTap;
  final String placeholder;
  final IconData? icon;
  final String? errorText;
  final bool showChevron;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Material(
          color: colors.outline,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
            side: BorderSide(color: errorText != null ? colors.destructive : colors.input),
          ),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              height: 44,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    if (icon != null) ...[
                      Icon(icon, size: 16, color: colors.mutedForeground),
                      const SizedBox(width: 8),
                    ],
                    Expanded(
                      child: Text(
                        value ?? placeholder,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 16,
                          color: value == null ? colors.mutedForeground : colors.foreground,
                        ),
                      ),
                    ),
                    if (showChevron) Icon(LucideIcons.chevronDown, size: 16, color: colors.mutedForeground),
                  ],
                ),
              ),
            ),
          ),
        ),
        if (errorText != null)
          // Mesmo recuo das mensagens de erro dos campos de texto.
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 6, 12, 0),
            child: Text(errorText!, style: TextStyle(fontSize: 12, color: colors.destructive)),
          ),
      ],
    );
  }
}

class SegmentOption<T> {
  const SegmentOption(this.value, this.label, {this.trailing});

  final T value;
  final String label;
  final String? trailing;
}

/// Controle segmentado com fundo cinza, como o `FormSegmentedField` do web.
class SegmentedControl<T> extends StatelessWidget {
  const SegmentedControl({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
    this.enabled = true,
    this.fontSize = 14,
  });

  final List<SegmentOption<T>> options;
  final T value;
  final ValueChanged<T> onChanged;
  final bool enabled;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Opacity(
      opacity: enabled ? 1 : 0.6,
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(color: colors.muted, borderRadius: BorderRadius.circular(10)),
        child: Row(
          children: [
            for (final (index, option) in options.indexed) ...[
              if (index > 0) const SizedBox(width: 4),
              Expanded(
                child: Semantics(
                  selected: option.value == value,
                  button: true,
                  child: GestureDetector(
                    onTap: enabled ? () => onChanged(option.value) : null,
                    behavior: HitTestBehavior.opaque,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      height: 36,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: option.value == value ? colors.background : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: option.value == value
                            ? const [BoxShadow(color: Color(0x1A000000), blurRadius: 2, offset: Offset(0, 1))]
                            : null,
                      ),
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text.rich(
                          TextSpan(
                            text: option.label,
                            children: [
                              if (option.trailing != null)
                                TextSpan(
                                  text: ' ${option.trailing}',
                                  style: TextStyle(fontSize: fontSize - 1, color: colors.mutedForeground),
                                ),
                            ],
                          ),
                          style: TextStyle(
                            fontSize: fontSize,
                            fontWeight: FontWeight.w500,
                            color: option.value == value ? colors.foreground : colors.mutedForeground,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Chip de seleção múltipla; selecionado fica verde com um check.
class SelectChip extends StatelessWidget {
  const SelectChip({super.key, required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Semantics(
      selected: selected,
      button: true,
      child: Material(
        color: selected ? AppColors.primary : colors.background,
        shape: StadiumBorder(side: BorderSide(color: selected ? AppColors.primary : colors.border)),
        child: InkWell(
          onTap: onTap,
          customBorder: const StadiumBorder(),
          child: Container(
            height: 36,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (selected) ...[
                  const Icon(LucideIcons.check, size: 14, color: Colors.white),
                  const SizedBox(width: 6),
                ],
                Text(
                  label,
                  style: TextStyle(fontSize: 14, color: selected ? Colors.white : colors.foreground),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Seção de um formulário de filtros (título e dica à direita).
class FilterSection extends StatelessWidget {
  const FilterSection({super.key, required this.title, required this.children, this.hint});

  final String title;
  final String? hint;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(child: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600))),
              if (hint != null)
                Text(hint!, style: TextStyle(fontSize: 12, color: context.colors.mutedForeground)),
            ],
          ),
          const SizedBox(height: 12),
          for (final (index, child) in children.indexed) ...[
            if (index > 0) const SizedBox(height: 12),
            child,
          ],
        ],
      );
}

String? requiredMin(String? value, int min, String message) =>
    (value ?? '').trim().length < min ? message : null;

String? validateEmail(String? value) =>
    RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch((value ?? '').trim())
        ? null
        : 'Informe um e-mail válido';
