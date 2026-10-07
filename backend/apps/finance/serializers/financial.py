from rest_framework import serializers

from ..enums import CategoryType
from .base_financial import BaseFinancialSerializer
from .list_financial import ListFinancialSerializer
from apps.finance.models import Expense, Income


# A categoria precisa ser do mesmo tipo do lançamento, na criação e na edição.
class TypedFinancialSerializer(BaseFinancialSerializer):
    category_type = None
    category_error = ""

    def validate(self, attrs):
        attrs = super().validate(attrs)

        category = attrs.get("category")

        if category and category.type != self.category_type:
            raise serializers.ValidationError({"category": self.category_error})

        return attrs


class ExpenseCategoryMixin:
    category_type = CategoryType.EXPENSE
    category_error = "Categoria inválida para uma despesa."


class IncomeCategoryMixin:
    category_type = CategoryType.INCOME
    category_error = "Categoria inválida para uma receita."


class CreateExpenseSerializer(ExpenseCategoryMixin, TypedFinancialSerializer):
    pass


class CreateIncomeSerializer(IncomeCategoryMixin, TypedFinancialSerializer):
    pass


class UpdateExpenseSerializer(ExpenseCategoryMixin, TypedFinancialSerializer):
    pass


class UpdateIncomeSerializer(IncomeCategoryMixin, TypedFinancialSerializer):
    pass


class ListExpenseSerializer(ListFinancialSerializer):
    class Meta(ListFinancialSerializer.Meta):
        model = Expense


class ListIncomeSerializer(ListFinancialSerializer):
    class Meta(ListFinancialSerializer.Meta):
        model = Income
