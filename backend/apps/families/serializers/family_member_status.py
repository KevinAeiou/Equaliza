from rest_framework import serializers

from apps.families.models import FamilyMember


class FamilyMemberStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMember
        fields = (
            "id",
            "is_active",
        )
