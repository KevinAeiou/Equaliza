from rest_framework import serializers

from apps.families.models import FamilyMember


class ListFamilyMemberSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.first_name")
    email = serializers.EmailField(source="user.email")
    role = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = FamilyMember
        fields = (
            "id",
            "name",
            "email",
            "role",
            "joined_at",
            "is_active",
        )
