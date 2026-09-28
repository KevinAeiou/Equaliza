/// Variáveis de ambiente definidas em tempo de build via `--dart-define`.
///
/// Exemplo: `flutter run --dart-define=API_URL=https://minha-api.onrender.com`
abstract final class Env {
  /// Por padrão aponta para o backend local visto pelo emulador Android.
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:8000',
  );
}
