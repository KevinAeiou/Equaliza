from rest_framework import serializers

from apps.families.models import Family


class UpdateFamilySerializer(serializers.ModelSerializer):
    class Meta:
        model = Family
        fields = ("name",)
