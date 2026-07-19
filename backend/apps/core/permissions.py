from rest_framework.permissions import BasePermission

from apps.families.models import FamilyMember


class IsFamilyMember(BasePermission):
    message = "Apenas usuários pertencentes a pelo menos uma família podem criar despesas/receitas."

    def has_permission(self, request, view):
        family = request.user.current_family
        
        if family is None:
            return False

        return FamilyMember.objects.is_member(
            family=family,
            user=request.user,
        )


class IsFamilyAdministrator(BasePermission):
    message = "Apenas responsáveis e administradores podem realizar esta ação."

    def has_permission(self, request, view):
        family = request.user.current_family

        if family is None:
            return False

        return FamilyMember.objects.is_administrator(
            family=family,
            user=request.user,
        )
