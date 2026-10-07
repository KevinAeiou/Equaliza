from rest_framework import serializers


class DetailSerializer(serializers.Serializer):
    """Resposta simples com uma mensagem (`{"detail": "..."}`)."""

    detail = serializers.CharField()


class UserRefSerializer(serializers.Serializer):
    """Referência resumida a um usuário (quem criou um registro)."""

    id = serializers.IntegerField()
    name = serializers.CharField()


def user_ref(user):
    """Serializa a referência a um usuário; `None` quando o registro não tem autor."""
    if user is None:
        return None

    return {
        "id": user.id,
        "name": user.get_full_name() or user.email,
    }


class HealthSerializer(serializers.Serializer):
    status = serializers.CharField()
