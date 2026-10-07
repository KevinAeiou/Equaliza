from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.families.models import Family


class FamilyOverviewSerializer(serializers.ModelSerializer):
    """Família vista pelo usuário logado: sua função e quantos membros ativos ela tem."""

    role = serializers.SerializerMethodField()
    is_active_member = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()

    class Meta:
        model = Family
        fields = [
            "id",
            "name",
            "role",
            "is_active_member",
            "members_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    # As memberships vêm pré-carregadas (prefetch) para evitar uma consulta por família.
    def _membership(self, obj):
        user = self.context["request"].user

        return next((item for item in obj.memberships.all() if item.user_id == user.id), None)

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_role(self, obj):
        membership = self._membership(obj)

        return membership.get_role_display() if membership else None

    @extend_schema_field(serializers.BooleanField())
    def get_is_active_member(self, obj):
        membership = self._membership(obj)

        return bool(membership and membership.is_active)

    @extend_schema_field(serializers.IntegerField())
    def get_members_count(self, obj):
        return sum(1 for item in obj.memberships.all() if item.is_active)
