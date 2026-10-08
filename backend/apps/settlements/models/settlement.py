from django.conf import settings
from django.db import models
from django.db.models import F, Q
from django.utils import timezone

from apps.core.models import BaseModel
from apps.settlements.constants import NOTE_MAX_LENGTH
from apps.settlements.enums import SettlementStatus


class Settlement(BaseModel):
    """Pagamento (total ou parcial) registrado pelo devedor a um membro com crédito.

    Não é receita nem despesa: só abate o saldo entre os membros.
    """

    family = models.ForeignKey(
        "families.Family", on_delete=models.CASCADE, related_name="settlements"
    )
    payer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="settlements_paid"
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="settlements_received"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference_month = models.DateField(help_text="Primeiro dia do mês acertado.")
    paid_at = models.DateField(default=timezone.localdate)
    note = models.CharField(max_length=NOTE_MAX_LENGTH, blank=True)
    status = models.CharField(
        max_length=20, choices=SettlementStatus.choices, default=SettlementStatus.ACTIVE
    )
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="settlements_cancelled",
    )
    # Retrato do que restou ao pagador e do mês para onde o restante foi.
    remaining_after = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    carried_to = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "settlements"
        indexes = [
            models.Index(fields=["family", "reference_month"], name="settle_family_month_idx"),
            models.Index(fields=["family", "-paid_at"], name="settle_family_paid_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=~Q(payer=F("receiver")), name="settlement_payer_not_receiver"
            ),
            models.CheckConstraint(condition=Q(amount__gt=0), name="settlement_amount_positive"),
        ]

    def __str__(self):
        return f"{self.payer_id} → {self.receiver_id}: {self.amount}"
