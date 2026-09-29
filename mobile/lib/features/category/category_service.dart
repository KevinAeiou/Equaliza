import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../models/finance.dart';

abstract final class CategoryService {
  static Future<List<Category>> list({String name = '', EntryType? type}) =>
      guard('listar categorias', () async {
        final response = await api.get('finances/categories/', queryParameters: {
          if (name.trim().isNotEmpty) 'name': name.trim(),
          if (type != null) 'type': type.value,
        });

        return (response.data as List)
            .map((item) => Category.fromJson(item as Map<String, dynamic>))
            .toList();
      });

  static Future<void> save({int? id, required String name, required EntryType type}) =>
      guard(id == null ? 'criar categoria' : 'atualizar categoria', () async {
        final data = {'name': name, 'type': type.value};

        if (id == null) {
          await api.post('finances/categories/', data: data);
        } else {
          await api.put('finances/categories/$id/', data: data);
        }
      });

  static Future<void> delete(int id) => guard('excluir categoria', () async {
        await api.delete('finances/categories/$id/');
      });
}
