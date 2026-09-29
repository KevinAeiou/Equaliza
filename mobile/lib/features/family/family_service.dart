import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../models/member.dart';
import '../../models/user.dart';

abstract final class FamilyService {
  static Future<List<FamilyOverview>> list() => guard('listar famílias', () async {
        final response = await api.get('families/');

        return (response.data as List)
            .map((item) => FamilyOverview.fromJson(item as Map<String, dynamic>))
            .toList();
      });

  static Future<void> save({int? id, required String name}) =>
      guard(id == null ? 'criar família' : 'atualizar família', () async {
        if (id == null) {
          await api.post('families/', data: {'name': name});
        } else {
          await api.put('families/$id/', data: {'name': name});
        }
      });

  static Future<void> delete(int id) => guard('excluir família', () async {
        await api.delete('families/$id/');
      });

  static Future<List<Member>> members() => guard('listar membros', () async {
        final response = await api.get('families/members/');

        return (response.data as List)
            .map((item) => Member.fromJson(item as Map<String, dynamic>))
            .toList();
      });

  static Future<void> toggleMember(int id) => guard('alternar estado do membro', () async {
        await api.patch('families/members/$id/status/');
      });

  static Future<void> removeMember(int id) => guard('excluir membro', () async {
        await api.delete('families/members/$id/');
      });
}
