from apps.families.models import FamilyMember


class ListFamilyMemberService:

    @staticmethod
    def execute(user):
        return (
            FamilyMember.objects.for_family(user.current_family)
            .exclude(user=user)
            .select_related("user")
            .order_by("user__first_name")
        )
