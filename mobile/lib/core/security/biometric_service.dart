import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';

/// Credenciais guardadas no cofre do aparelho (Keystore no Android, Keychain no iOS).
typedef StoredCredentials = ({String email, String password});

/// Login por biometria: o e-mail e a senha ficam no armazenamento seguro e só
/// são lidos depois que o usuário confirma a digital ou o rosto.
abstract final class BiometricService {
  static const _emailKey = 'biometric_email';
  static const _passwordKey = 'biometric_password';

  static final _auth = LocalAuthentication();
  static const _storage = FlutterSecureStorage();

  /// O aparelho tem sensor e pelo menos uma biometria cadastrada.
  static Future<bool> isAvailable() async {
    if (kIsWeb) return false;

    try {
      if (!await _auth.isDeviceSupported() || !await _auth.canCheckBiometrics) return false;

      return (await _auth.getAvailableBiometrics()).isNotEmpty;
    } on PlatformException {
      return false;
    }
  }

  static Future<bool> isEnabled() async {
    try {
      return await _storage.containsKey(key: _passwordKey);
    } on PlatformException {
      return false;
    }
  }

  static Future<bool> authenticate(String reason) async {
    try {
      return await _auth.authenticate(localizedReason: reason, biometricOnly: true);
    } on LocalAuthException {
      // Cancelado, bloqueado ou sem biometria: o usuário segue com a senha.
      return false;
    } on PlatformException {
      return false;
    }
  }

  static Future<void> save(String email, String password) async {
    await _storage.write(key: _emailKey, value: email);
    await _storage.write(key: _passwordKey, value: password);
  }

  static Future<StoredCredentials?> read() async {
    try {
      final email = await _storage.read(key: _emailKey);
      final password = await _storage.read(key: _passwordKey);

      if (email == null || password == null) return null;

      return (email: email, password: password);
    } on PlatformException {
      return null;
    }
  }

  static Future<void> clear() async {
    try {
      await _storage.delete(key: _emailKey);
      await _storage.delete(key: _passwordKey);
    } on PlatformException {
      // Sem acesso ao cofre não há o que apagar.
    }
  }
}
