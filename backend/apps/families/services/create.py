from apps.families.enums import FamilyRole
from apps.families.models import Family, FamilyMember
from apps.users.models import User


class CreateFamilyService:

    @staticmethod
    def execute(user: User, name):

        family = Family.objects.create(
            name=name,
            created_by=user,
            updated_by=user,
        )

        FamilyMember.objects.create(
            family=family,
            user=user,
            role=FamilyRole.OWNER,
            created_by=user,
            updated_by=user,
        )

        if user.current_family is None:
            user.current_family = family
            user.save(update_fields=["current_family"])

        return family
