from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class RegisteredUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()


class RegisterResponseSerializer(serializers.Serializer):
    user = RegisteredUserSerializer()


class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    family_name = serializers.CharField(
        required=False,
        allow_blank=True,
    )
    token = serializers.UUIDField(required=False)

    def validate_email(self, value):

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Já existe um usuário com este e-mail.")

        return value
