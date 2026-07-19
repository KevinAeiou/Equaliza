from django.shortcuts import get_object_or_404

from apps.families.models import FamilyMember
from apps.users.models import User


class DeleteFamilyMemberService:

    def execute(self, *, family, member_id):
        member: FamilyMember = get_object_or_404(
            FamilyMember.objects.active(),
            id=member_id,
            family=family,
        )

        user: User = member.user

        if user.current_family == family:
            user.current_family = None
            user.save(update_fields=["current_family"])

        member.delete()
