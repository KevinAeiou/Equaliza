from rest_framework import serializers


class CreateInvitationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
