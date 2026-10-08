from rest_framework import serializers


class CurrentFamilySerializer(serializers.Serializer):
    family_id = serializers.IntegerField()
