from rest_framework.exceptions import PermissionDenied

from apps.families.models import FamilyMember


class DeleteFamilyService:

    @staticmethod
    def execute(*, family, user):
        if not FamilyMember.objects.is_administrator(
            family=family,
            user=user,
        ):
            raise PermissionDenied(
                "Você não possui permissão para excluir esta família."
            )

        family.delete()
