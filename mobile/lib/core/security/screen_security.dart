import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Bloqueia capturas e gravações de tela (`FLAG_SECURE` no Android), e também esconde o conteúdo
/// no seletor de apps. No iOS não há equivalente simples: o canal não existe e a chamada é ignorada.
abstract final class ScreenSecurity {
  static const _channel = MethodChannel('com.equaliza.equaliza/screen_security');

  static Future<void> enable() => _set(true);

  static Future<void> disable() => _set(false);

  static Future<void> _set(bool secure) async {
    if (kIsWeb) return;

    try {
      await _channel.invokeMethod<void>('setSecure', secure);
    } on MissingPluginException {
      // iOS, testes e desktop: sem bloqueio nativo.
    } on PlatformException {
      // Sem o bloqueio a tela segue funcionando.
    }
  }
}
