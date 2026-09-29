import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../models/member.dart';
import '../../models/user.dart';

abstract final class AuthService {
  static Future<void> login(String email, String password) => guard('autenticar', () async {
        await api.post('login/', data: {'email': email, 'password': password});
      });

  static Future<User> me() => guard('pegar usuário', () async {
        final response = await api.get('me/');

        return User.fromJson(response.data as Map<String, dynamic>);
      });

  static Future<void> logout() async {
    try {
      await api.post('logout/');
    } catch (_) {
      // Mesmo com falha no servidor, a sessão local é encerrada.
    } finally {
      await clearSession();
    }
  }

  static Future<void> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? familyName,
    String? token,
  }) =>
      guard('cadastrar usuário', () async {
        await api.post('register/', data: {
          'first_name': firstName,
          'last_name': lastName,
          'email': email,
          'password': password,
          'family_name': familyName ?? '',
          'token': ?token,
        });
      });

  static Future<void> updateProfile({
    required String firstName,
    required String lastName,
    required String avatar,
  }) =>
      guard('editar usuário', () async {
        await api.patch('profile/', data: {
          'first_name': firstName,
          'last_name': lastName,
          'avatar': avatar,
        });
      });

  static Future<void> changeCurrentFamily(int familyId) => guard('alterar família atual', () async {
        await api.patch('current/', data: {'family_id': familyId});
      });

  /// Aceita o link completo do convite (`.../register?token=...`) ou só o código.
  static String? extractToken(String input) => RegExp(
        r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
      ).firstMatch(input)?.group(0);

  static Future<InvitationPreview> validateInvitation(String token) =>
      guard('validar convite', () async {
        final response = await api.get('invitations/$token/validate/');
        final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
        final family = data['family'] as Map<String, dynamic>? ?? {};

        return InvitationPreview(
          token: token,
          email: data['email'] as String? ?? '',
          familyName: family['name'] as String? ?? '',
        );
      });
}
