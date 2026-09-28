from rest_framework.exceptions import ValidationError

from apps.finance.models import FinancialCategory


class UpdateFinancialCategoryService:
    UPDATABLE_FIELDS = (
        "name",
        "type",
    )

    @staticmethod
    def execute(*, category: FinancialCategory, data):
        if category.family is None:
            raise ValidationError(
                "Categorias padrão do sistema não podem ser alteradas."
            )

        if "type" in data and data["type"] != category.type and category.is_used:
            raise ValidationError(
                {
                    "type": (
                        "Não é possível alterar o tipo de uma categoria "
                        "que já possui lançamentos vinculados."
                    )
                }
            )

        for field in UpdateFinancialCategoryService.UPDATABLE_FIELDS:
            if field in data:
                setattr(category, field, data[field])

        category.save(
            update_fields=(
                *[
                    field
                    for field in UpdateFinancialCategoryService.UPDATABLE_FIELDS
                    if field in data
                ],
            )
        )

        return category
