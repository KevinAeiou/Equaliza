from django.db import models
from django.utils import timezone

from rest_framework.exceptions import ValidationError


class InvitationManager(models.Manager):

    @staticmethod
    def can_be_used(invitation):

        return (
            invitation.is_active
            and not invitation.is_used
            and not invitation.is_expired
        )

    def pending(self):
        return self.filter(
            is_active=True,
            accepted_at__isnull=True,
            expires_at__gt=timezone.now(),
        )

    def pending_for_email(self, family, email):
        return self.pending().filter(
            family=family,
            email__iexact=email,
        )

    def get_valid(self, token):
        from apps.invitations.models import Invitation

        try:
            invitation = self.select_related(
                "family",
            ).get(token=token)

        except Invitation.DoesNotExist:
            raise ValidationError({"token": "Convite não encontrado."})

        if not self.can_be_used(invitation):
            raise ValidationError(
                {"token": "Este convite expirou ou já foi utilizado."}
            )

        return invitation
