from datetime import timedelta

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.families.models import Family
from apps.finance.constants import DESCRIPTION_MAX_LENGTH
from apps.finance.enums import CategoryType
from apps.finance.models import Expense, FinancialCategory
from apps.imports.models import PendingTransaction

MAX_BULK = 500
DUPLICATE_WINDOW_DAYS = 2


class PendingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PendingTransaction
        fields = (
            "id", "batch", "direction", "kind", "account_ref", "source_category", "amount",
            "occurred_at", "description", "counterparty", "status", "flag", "expires_at",
        )
        read_only_fields = fields


class PendingDetailSerializer(PendingSerializer):
    possible_duplicate = serializers.SerializerMethodField()

    class Meta(PendingSerializer.Meta):
        fields = (*PendingSerializer.Meta.fields, "possible_duplicate")
        read_only_fields = fields

    def get_possible_duplicate(self, obj) -> bool:
        """Já existe despesa de mesmo valor e data próxima em alguma família do usuário?"""
        window = timedelta(days=DUPLICATE_WINDOW_DAYS)

        return Expense.objects.filter(
            family__memberships__user=obj.owner,
            family__memberships__is_active=True,
            amount=obj.amount,
            date__range=(obj.occurred_at - window, obj.occurred_at + window),
        ).exists()


@extend_schema_field(OpenApiTypes.INT)
class OwnFamilyField(serializers.PrimaryKeyRelatedField):
    """Só aceita famílias das quais o usuário é membro ativo; o erro é o mesmo para as demais."""

    def get_queryset(self):
        return Family.objects.filter(
            memberships__user=self.context["request"].user, memberships__is_active=True
        )


class ExpenseTargetMixin:
    def validate_target(self, attrs):
        family, category = attrs.get("family"), attrs.get("category")

        if category.type != CategoryType.EXPENSE:
            raise serializers.ValidationError({"category": "Categoria inválida para uma despesa."})

        if category.family_id and category.family_id != family.id:
            raise serializers.ValidationError({"category": "Esta categoria não pertence à família escolhida."})


class RegisterPendingSerializer(ExpenseTargetMixin, serializers.Serializer):
    family = OwnFamilyField()
    category = serializers.PrimaryKeyRelatedField(queryset=FinancialCategory.objects.all())
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01, required=False)
    date = serializers.DateField(required=False)
    description = serializers.CharField(required=False, allow_blank=True, max_length=DESCRIPTION_MAX_LENGTH)

    def validate(self, attrs):
        self.validate_target(attrs)

        return attrs


class BulkPendingSerializer(ExpenseTargetMixin, serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1), min_length=1, max_length=MAX_BULK
    )
    action = serializers.ChoiceField(choices=("import", "dismiss"))
    family = OwnFamilyField(required=False)
    category = serializers.PrimaryKeyRelatedField(queryset=FinancialCategory.objects.all(), required=False)

    def validate_ids(self, ids):
        if len(set(ids)) != len(ids):
            raise serializers.ValidationError("Há ids repetidos.")

        return ids

    def validate(self, attrs):
        if attrs["action"] == "import":
            missing = {key: "Obrigatório para registrar." for key in ("family", "category") if key not in attrs}

            if missing:
                raise serializers.ValidationError(missing)

            self.validate_target(attrs)

        return attrs


class BulkResultSerializer(serializers.Serializer):
    processed = serializers.IntegerField()
