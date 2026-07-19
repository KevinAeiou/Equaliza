from django.shortcuts import get_object_or_404

from apps.families.models import FamilyMember


class ToggleFamilyMemberStatusService:

    @staticmethod
    def execute(*, family, member_id):
        member = get_object_or_404(
            FamilyMember.objects.for_family(family),
            id=member_id,
        )

        member.is_active = not member.is_active
        member.save(update_fields=["is_active"])

        return member
