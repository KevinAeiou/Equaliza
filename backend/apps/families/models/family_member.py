from django.conf import settings
from django.db import models

from apps.core.models import BaseModel
from apps.families.enums import FamilyRole
from apps.families.managers import FamilyMemberManager


class FamilyMember(BaseModel):
    family = models.ForeignKey(
        "families.Family", on_delete=models.CASCADE, related_name="memberships"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memberships"
    )
    role = models.CharField(
        max_length=20, choices=FamilyRole.choices, default=FamilyRole.MEMBER
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    objects: FamilyMemberManager = FamilyMemberManager()

    class Meta:
        db_table = "family_members"
        constraints = [
            models.UniqueConstraint(
                fields=["family", "user"], name="unique_family_member"
            )
        ]
