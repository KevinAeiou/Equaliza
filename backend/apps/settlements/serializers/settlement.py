from decimal import Decimal

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.core.serializers import UserRefSerializer, user_ref

from apps.settlements.constants import NOTE_MAX_LENGTH
from apps.settlements.enums import SettlementStatus
from apps.settlements.models import Settlement
from apps.settlements.serializers.month import MonthField


class CreateSettlementSerializer(serializers.Serializer):
    receiver = serializers.IntegerField(help_text="Id do usuário que recebe.")
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.01"))
    month = MonthField(help_text="Mês acertado, no formato AAAA-MM.")
    note = serializers.CharField(max_length=NOTE_MAX_LENGTH, required=False, allow_blank=True, default="")
    paid_at = serializers.DateField(required=False, help_text="Data do pagamento; hoje por padrão.")


class ListSettlementParamsSerializer(serializers.Serializer):
    month = MonthField(required=False)
    member = serializers.IntegerField(required=False, help_text="Filtra por quem pagou ou recebeu.")
    status = serializers.ChoiceField(choices=SettlementStatus.choices, required=False)


class ListSettlementSerializer(serializers.ModelSerializer):
    payer = serializers.SerializerMethodField()
    receiver = serializers.SerializerMethodField()
    cancelled_by = serializers.SerializerMethodField()
    reference_month = serializers.SerializerMethodField()
    carried_to = serializers.SerializerMethodField()

    class Meta:
        model = Settlement
        fields = (
            "id",
            "payer",
            "receiver",
            "amount",
            "reference_month",
            "paid_at",
            "note",
            "status",
            "cancelled_at",
            "cancelled_by",
            "remaining_after",
            "carried_to",
        )

    @extend_schema_field(UserRefSerializer)
    def get_payer(self, obj):
        return user_ref(obj.payer)

    @extend_schema_field(UserRefSerializer)
    def get_receiver(self, obj):
        return user_ref(obj.receiver)

    @extend_schema_field(UserRefSerializer(allow_null=True))
    def get_cancelled_by(self, obj):
        return user_ref(obj.cancelled_by)

    @extend_schema_field(serializers.CharField())
    def get_reference_month(self, obj):
        return obj.reference_month.strftime("%Y-%m")

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_carried_to(self, obj):
        return obj.carried_to.strftime("%Y-%m") if obj.carried_to else None
