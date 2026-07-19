from rest_framework import serializers

from apps.families.models import Family


class FamilySerializer(serializers.ModelSerializer):

    class Meta:
        model = Family
        fields = (
            "id",
            "name",
        )
