from django.db import models


class FamilyManager(models.Manager):

    def get_queryset(self):
        return super().get_queryset()

    def for_user(self, user):
        return (
            self.get_queryset()
            .filter(
                memberships__user=user,
            )
            .distinct()
            .order_by("-created_at")
        )
