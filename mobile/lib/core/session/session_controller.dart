import 'package:flutter/foundation.dart';

import '../../features/auth/auth_service.dart';
import '../../models/user.dart';
import '../security/biometric_service.dart';
import '../network/api_client.dart' as client;
import '../network/api_exception.dart';

enum SessionStatus { loading, authenticated, unauthenticated }

/// Sessão do usuário: equivalente ao `AuthProvider` do web.
class SessionController extends ChangeNotifier {
  SessionController() {
    client.onUnauthorized = _expire;
  }

  SessionStatus _status = SessionStatus.loading;
  User? _user;

  SessionStatus get status => _status;

  User get user => _user!;

  User? get maybeUser => _user;

  /// Recupera a sessão salva nos cookies ao abrir o app.
  Future<void> restore() async {
    try {
      _user = await AuthService.me();
      _status = SessionStatus.authenticated;
    } catch (_) {
      _user = null;
      _status = SessionStatus.unauthenticated;
    }

    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    await AuthService.login(email, password);
    await refreshUser();
  }

  /// Entra com as credenciais guardadas, depois de confirmar a biometria.
  /// Devolve `false` se a biometria foi recusada ou não há credenciais salvas.
  Future<bool> loginWithBiometrics() async {
    final credentials = await BiometricService.read();

    if (credentials == null) return false;
    if (!await BiometricService.authenticate('Confirme sua identidade para entrar no Equaliza')) return false;

    try {
      await login(credentials.email, credentials.password);
    } on ApiException catch (error) {
      // Senha alterada ou conta removida: as credenciais guardadas não servem mais.
      if (error.status == 400 || error.status == 401) await BiometricService.clear();

      rethrow;
    }

    return true;
  }

  Future<void> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? familyName,
    String? token,
  }) async {
    await AuthService.register(
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      familyName: familyName,
      token: token,
    );

    await refreshUser();
  }

  /// Entra na família do convite; ela passa a ser a família atual.
  Future<String> acceptInvitation(String token) async {
    final familyName = await AuthService.acceptInvitation(token);
    await refreshUser();

    return familyName;
  }

  Future<User> refreshUser() async {
    _user = await AuthService.me();
    _status = SessionStatus.authenticated;
    notifyListeners();

    return _user!;
  }

  Future<void> updateProfile({
    required String firstName,
    required String lastName,
    required String avatar,
  }) async {
    await AuthService.updateProfile(firstName: firstName, lastName: lastName, avatar: avatar);
    await refreshUser();
  }

  Future<void> changeCurrentFamily(int familyId) async {
    await AuthService.changeCurrentFamily(familyId);
    await refreshUser();
  }

  Future<void> logout() async {
    await AuthService.logout();
    _expire();
  }

  void _expire() {
    if (_status == SessionStatus.unauthenticated) return;

    _user = null;
    _status = SessionStatus.unauthenticated;
    notifyListeners();
  }
}
