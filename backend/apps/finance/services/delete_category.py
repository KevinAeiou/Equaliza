from django.core.exceptions import ValidationError
from django.db.models.deletion import ProtectedError


class DeleteFinancialCategoryService:

    @staticmethod
    def execute(*, category):
        if category.family is None:
            raise ValidationError(
                "Categorias padrão do sistema não podem ser excluídas."
            )

        try:
            category.delete()
        except ProtectedError:
            raise ValidationError(
                "Esta categoria não pode ser excluída porque está sendo utilizada."
            )
