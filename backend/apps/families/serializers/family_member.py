from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.families.models import FamilyMember


class ListFamilyMemberSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email")
    role = serializers.CharField(source="get_role_display", read_only=True)
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = FamilyMember
        fields = (
            "id",
            "name",
            "email",
            "role",
            "avatar",
            "joined_at",
            "is_active",
        )

    @extend_schema_field(serializers.CharField())
    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.email

    @extend_schema_field(serializers.CharField())
    def get_avatar(self, obj):
        # Mesmo formato do avatar em UserSerializer.
        return f"/avatars/{obj.user.avatar}.jpg"
