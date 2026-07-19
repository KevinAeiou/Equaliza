from rest_framework import serializers

from apps.invitations.models import Invitation


class ListInvitationSerializer(serializers.ModelSerializer):
    status = serializers.CharField(read_only=True)
    link = serializers.CharField(source="invitation_link", read_only=True)

    class Meta:
        model = Invitation
        fields = (
            "id",
            "email",
            "expires_at",
            "status",
            "link",
        )
