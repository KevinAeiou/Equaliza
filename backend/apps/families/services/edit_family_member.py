from django.shortcuts import get_object_or_404

from apps.families.models import FamilyMember
from apps.users.models import User


class ToggleFamilyMemberStatusService:

    @staticmethod
    def execute(*, user: User, member_id):
        member = get_object_or_404(
            FamilyMember.objects.for_family(user.current_family),
            id=member_id,
        )

        member.is_active = not member.is_active
        member.updated_by = user

        member.save(
            update_fields=[
                "is_active",
                "updated_at",
                "updated_by",
            ]
        )

        return member
