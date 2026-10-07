from rest_framework import serializers

from ..enums import CategoryType
from .base_financial import BaseFinancialSerializer
from .list_financial import ListFinancialSerializer
from apps.finance.models import Expense, Income


class CreateExpenseSerializer(BaseFinancialSerializer):
    pass


class CreateIncomeSerializer(BaseFinancialSerializer):
    pass


# Na edição, a categoria precisa ser do mesmo tipo do lançamento.
class UpdateFinancialSerializer(BaseFinancialSerializer):
    category_type = None
    category_error = ""

    def validate(self, attrs):
        attrs = super().validate(attrs)

        category = attrs.get("category")

        if category and category.type != self.category_type:
            raise serializers.ValidationError({"category": self.category_error})

        return attrs


class UpdateExpenseSerializer(UpdateFinancialSerializer):
    category_type = CategoryType.EXPENSE
    category_error = "Categoria inválida para uma despesa."


class UpdateIncomeSerializer(UpdateFinancialSerializer):
    category_type = CategoryType.INCOME
    category_error = "Categoria inválida para uma receita."


class ListExpenseSerializer(ListFinancialSerializer):
    class Meta(ListFinancialSerializer.Meta):
        model = Expense


class ListIncomeSerializer(ListFinancialSerializer):
    class Meta(ListFinancialSerializer.Meta):
        model = Income
