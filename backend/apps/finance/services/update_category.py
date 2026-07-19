from django.core.exceptions import ValidationError


class UpdateFinancialCategoryService:
    UPDATABLE_FIELDS = (
        "name",
        "type",
    )

    @staticmethod
    def execute(*, category, data):
        if category.family is None:
            raise ValidationError(
                "Categorias padrão do sistema não podem ser alteradas."
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
                "updated_by",
            )
        )

        return category
