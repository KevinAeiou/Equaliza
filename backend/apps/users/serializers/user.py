from rest_framework import serializers
from apps.users.models import User
from apps.families.models import FamilyMember
from .family import FamilySerializer


class UserSerializer(serializers.ModelSerializer):
    current_family = FamilySerializer(read_only=True)

    families = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "current_family",
            "families",
            "role",
            "avatar",
        ]

    def get_families(self, obj):
        memberships = obj.memberships.select_related("family").filter(is_active=True)

        return FamilySerializer(
            [m.family for m in memberships],
            many=True,
        ).data

    def get_role(self, obj):
        if obj.current_family is None:
            return None

        return FamilyMember.objects.get_user_role(
            user=obj,
            family=obj.current_family,
        )

    def get_avatar(self, obj):
        return {
            "id": obj.avatar,
            "url": f"/avatars/{obj.avatar}.jpg",
        }
