import 'parsing.dart';

abstract final class UserRole {
  static const owner = 'Responsável';
  static const admin = 'Administrador';
  static const member = 'Membro';
}

class Family {
  const Family({required this.id, required this.name, this.createdAt});

  factory Family.fromJson(Map<String, dynamic> json) => Family(
        id: json['id'] as int,
        name: json['name'] as String? ?? '',
        createdAt: toDate(json['created_at']),
      );

  final int id;
  final String name;
  final DateTime? createdAt;
}

/// Família como aparece na tela de famílias, com o papel do usuário nela.
class FamilyOverview extends Family {
  const FamilyOverview({
    required super.id,
    required super.name,
    super.createdAt,
    this.role,
    required this.isActiveMember,
    required this.membersCount,
  });

  factory FamilyOverview.fromJson(Map<String, dynamic> json) => FamilyOverview(
        id: json['id'] as int,
        name: json['name'] as String? ?? '',
        createdAt: toDate(json['created_at']),
        role: json['role'] as String?,
        isActiveMember: json['is_active_member'] as bool? ?? true,
        membersCount: json['members_count'] as int? ?? 0,
      );

  final String? role;
  final bool isActiveMember;
  final int membersCount;
}

class User {
  const User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    required this.currentFamily,
    required this.families,
    required this.avatarId,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    final avatar = json['avatar'];
    final current = json['current_family'];

    return User(
      id: json['id'] as int,
      email: json['email'] as String? ?? '',
      firstName: json['first_name'] as String? ?? '',
      lastName: json['last_name'] as String? ?? '',
      role: json['role'] as String?,
      currentFamily: current is Map<String, dynamic> ? Family.fromJson(current) : null,
      families: (json['families'] as List? ?? [])
          .map((item) => Family.fromJson(item as Map<String, dynamic>))
          .toList(),
      avatarId: avatar is Map ? avatar['id'] as String? : null,
    );
  }

  final int id;
  final String email;
  final String firstName;
  final String lastName;
  final String? role;
  final Family? currentFamily;
  final List<Family> families;
  final String? avatarId;

  String get fullName => [firstName, lastName].where((part) => part.isNotEmpty).join(' ');

  /// Categorias, Membros e Convites exigem responsável ou administrador.
  /// Sem papel (sem família atual), o web libera a navegação.
  bool get isAdmin => role == null || role == UserRole.owner || role == UserRole.admin;
}
