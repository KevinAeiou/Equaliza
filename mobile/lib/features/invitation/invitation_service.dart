import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../models/member.dart';

abstract final class InvitationService {
  static Future<List<Invitation>> list() => guard('listar convites', () async {
        final response = await api.get('invitations/');

        return (response.data as List)
            .map((item) => Invitation.fromJson(item as Map<String, dynamic>))
            .toList();
      });

  static Future<void> create(String email) => guard('criar convite', () async {
        await api.post('invitations/', data: {'email': email});
      });

  static Future<void> delete(int id) => guard('excluir convite', () async {
        await api.delete('invitations/$id/');
      });
}
