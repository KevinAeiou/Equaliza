from rest_framework import serializers

from apps.users.models import User
from apps.users.enuns import Avatar


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "avatar",
        ]

    def validate_avatar(self, value):
        if value not in Avatar.values:
            raise serializers.ValidationError("Avatar inválido.")

        return value

    def validate_first_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Informe um nome.")

        return value
    
    def validate_last_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Informe um sobrenome.")

        return value