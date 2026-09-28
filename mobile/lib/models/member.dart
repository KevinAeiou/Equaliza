import 'parsing.dart';

class Member {
  const Member({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.avatarId,
    required this.joinedAt,
    required this.isActive,
  });

  factory Member.fromJson(Map<String, dynamic> json) {
    // O avatar chega como caminho do web: "/avatars/avatar-2.jpg".
    final avatar = json['avatar'] as String? ?? '';
    final match = RegExp(r'avatar-\d+').firstMatch(avatar);

    return Member(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? '',
      avatarId: match?.group(0),
      joinedAt: toDate(json['joined_at']),
      isActive: json['is_active'] as bool? ?? true,
    );
  }

  final int id;
  final String name;
  final String email;
  final String role;
  final String? avatarId;
  final DateTime? joinedAt;
  final bool isActive;
}

class Invitation {
  const Invitation({
    required this.id,
    required this.email,
    required this.status,
    required this.link,
    this.createdAt,
    this.expiresAt,
    this.acceptedAt,
  });

  factory Invitation.fromJson(Map<String, dynamic> json) => Invitation(
        id: json['id'] as int,
        email: json['email'] as String? ?? '',
        status: json['status'] as String? ?? 'Pendente',
        link: json['link'] as String? ?? '',
        createdAt: toDate(json['created_at']),
        expiresAt: toDate(json['expires_at']),
        acceptedAt: toDate(json['accepted_at']),
      );

  final int id;
  final String email;
  final String status;
  final String link;
  final DateTime? createdAt;
  final DateTime? expiresAt;
  final DateTime? acceptedAt;

  bool get pending => status == 'Pendente';
}

/// Dados de um convite válido, usados para preencher o cadastro.
class InvitationPreview {
  const InvitationPreview({
    required this.token,
    required this.email,
    required this.familyName,
  });

  final String token;
  final String email;
  final String familyName;
}
