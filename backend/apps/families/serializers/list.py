from rest_framework import serializers

from apps.families.models import Family


class ListFamilySerializer(serializers.ModelSerializer):

    class Meta:
        model = Family
        fields = [
            "id",
            "name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
