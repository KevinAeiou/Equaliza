from django.utils import timezone

from apps.families.models import FamilyMember
from apps.families.enums import FamilyRole


class AcceptInvitationService:

    @staticmethod
    def execute(*, invitation, user):

        FamilyMember.objects.create(
            family=invitation.family,
            user=user,
            role=FamilyRole.MEMBER,
            created_by=user,
            updated_by=user,
        )

        user.current_family = invitation.family
        user.save(update_fields=["current_family"])

        invitation.accepted_at = timezone.now()
        invitation.is_active = False
        invitation.updated_by = user
        invitation.save(
            update_fields=[
                "accepted_at",
                "is_active",
                "updated_by",
            ]
        )
