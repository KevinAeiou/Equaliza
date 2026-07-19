import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import BaseModel
from apps.families.models import Family
from apps.invitations.managers import InvitationManager


class Invitation(BaseModel):
    token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )

    family = models.ForeignKey(
        Family,
        on_delete=models.CASCADE,
        related_name="invitations",
    )

    email = models.EmailField(
        blank=True,
        null=True,
    )

    expires_at = models.DateTimeField()

    accepted_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(default=True)

    objects: InvitationManager = InvitationManager()

    class Meta:
        db_table = "invitations"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_used(self):
        return self.accepted_at is not None

    @property
    def status(self):
        if self.is_used:
            return "Aceito"

        if self.is_expired:
            return "Expirado"

        return "Pendente"

    @property
    def invitation_link(self) -> str:
        return f"{settings.FRONTEND_URL}/register?token={self.token}"
