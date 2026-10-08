from rest_framework import serializers


class InvitationFamilySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class ValidateInvitationDataSerializer(serializers.Serializer):
    email = serializers.EmailField()
    family = InvitationFamilySerializer()
    expires_at = serializers.DateTimeField()


class ValidateInvitationResponseSerializer(serializers.Serializer):
    data = ValidateInvitationDataSerializer()


class AcceptInvitationDataSerializer(serializers.Serializer):
    family = InvitationFamilySerializer()


class AcceptInvitationResponseSerializer(serializers.Serializer):
    data = AcceptInvitationDataSerializer()
