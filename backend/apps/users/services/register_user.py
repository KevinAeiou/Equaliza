# services/register_user.py

from apps.families.enums import FamilyRole
from apps.families.models import Family, FamilyMember
from apps.users.models import User


class RegisterUserService:

    @staticmethod
    def execute(data):
        family_name = (
            data.pop("family_name", "").strip() or f"Família {data['last_name']}"
        )

        user = User.objects.create_user(**data)

        family = Family.objects.create(
            name=family_name,
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

        user.current_family = family
        user.save(update_fields=["current_family"])

        return user
