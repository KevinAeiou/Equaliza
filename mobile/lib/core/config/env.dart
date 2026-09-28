import 'package:flutter/foundation.dart';

/// Variáveis de ambiente definidas em tempo de build via `--dart-define`.
///
/// Exemplo: `flutter run --dart-define=API_URL=https://minha-api.onrender.com`
/// ou `flutter run --dart-define-from-file=config/production.json`.
abstract final class Env {
  static const _defined = String.fromEnvironment('API_URL');

  /// Por padrão (só em debug) aponta para o backend local visto pelo emulador Android.
  static final String apiUrl = (_defined.isEmpty ? 'http://10.0.2.2:8000' : _defined)
      .replaceFirst(RegExp(r'/+$'), '');

  /// Motivo pelo qual a configuração não serve para este build, ou `null` se estiver ok.
  ///
  /// Em produção o backend só aceita HTTPS (`SECURE_SSL_REDIRECT`) e envia os cookies
  /// de sessão com a flag `Secure`, que não são reenviados por HTTP.
  static String? get problem {
    if (!kReleaseMode) return null;

    if (_defined.isEmpty) {
      return 'O endereço da API não foi definido no build. '
          'Gere o app com --dart-define=API_URL=https://sua-api.onrender.com.';
    }

    if (!apiUrl.startsWith('https://')) {
      return 'O endereço da API precisa usar HTTPS: $apiUrl';
    }

    return null;
  }
}
