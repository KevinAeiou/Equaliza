from django.db import models


class FamilyManager(models.Manager):

    def get_queryset(self):
        return super().get_queryset()

    def for_user(self, user):
        return self.filter(
            memberships__user=user, memberships__is_active=True
        ).distinct()

