from django.db import models

from apps.families.enums import FamilyRole


class FamilyMemberManager(models.Manager):

    def active(self):
        return self.filter(is_active=True)

    def owners(self):
        return self.filter(role=FamilyRole.OWNER)

    def admins(self):
        return self.filter(role=FamilyRole.ADMIN)

    def members(self):
        return self.filter(role=FamilyRole.MEMBER)

    def for_family(self, family):
        return self.filter(family=family)

    def get_active_membership(self, user, family_id):
        return (
            self.select_related("family")
            .filter(
                user=user,
                family_id=family_id,
                is_active=True,
            )
            .first()
        )

    def get_user_role(self, user, family):
        membership = (
            self.active()
            .filter(
                user=user,
                family=family,
            )
            .only("role")
            .first()
        )

        return membership.get_role_display() if membership else None

    def is_administrator(self, *, family, user):
        return (
            self.active()
            .filter(
                family=family,
                user=user,
                role__in=[
                    FamilyRole.OWNER,
                    FamilyRole.ADMIN,
                ],
            )
            .exists()
        )

    def is_member(self, *, family, user):
        return (
            self.active()
            .filter(
                family=family,
                user=user,
            )
            .exists()
        )
