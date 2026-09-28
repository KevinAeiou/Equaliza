from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.families.models import FamilyMember


class IsFamilyMember(BasePermission):
    message = "Você precisa fazer parte de uma família para registrar receitas e despesas."

    def has_permission(self, request, view):
        family = request.user.current_family

        # Sem família, as consultas apenas retornam vazio; alterações não teriam onde ser gravadas.
        if family is None:
            return request.method in SAFE_METHODS

        return FamilyMember.objects.is_member(
            family=family,
            user=request.user,
        )


class IsFamilyAdministrator(BasePermission):
    message = "Apenas responsáveis e administradores podem realizar esta ação."

    def has_permission(self, request, view):
        family = request.user.current_family

        # Sem família, uma categoria seria criada sem dono e ficaria visível para todas as famílias.
        if family is None:
            if request.method in SAFE_METHODS:
                return True

            self.message = "Você precisa fazer parte de uma família para realizar esta ação."
            return False

        return FamilyMember.objects.is_administrator(
            family=family,
            user=request.user,
        )
