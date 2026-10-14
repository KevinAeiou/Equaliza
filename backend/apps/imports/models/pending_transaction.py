from django.conf import settings
from django.db import models

from apps.imports.enums import Direction, PendingFlag, PendingStatus
from apps.imports.fields import EncryptedTextField


class PendingTransaction(models.Model):
    """Linha de um extrato ou fatura aguardando decisão. Pertence ao usuário, não à família."""

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="pending_transactions"
    )
    batch = models.ForeignKey(
        "imports.ImportBatch", on_delete=models.CASCADE, related_name="transactions"
    )
    # HMAC do id da transação (ou das suas características); sobrevive ao apagamento dos dados.
    external_id_hash = models.CharField(max_length=64)
    direction = models.CharField(max_length=10, choices=Direction.choices)
    kind = models.CharField(max_length=60, blank=True)
    account_ref = models.CharField(max_length=4, blank=True)
    source_category = models.CharField(max_length=100, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    occurred_at = models.DateField()
    description = EncryptedTextField(blank=True, default="")
    counterparty = EncryptedTextField(blank=True, default="")
    status = models.CharField(
        max_length=10, choices=PendingStatus.choices, default=PendingStatus.PENDING
    )
    expense = models.ForeignKey(
        "finance.Expense", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    flag = models.CharField(max_length=20, choices=PendingFlag.choices, blank=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-occurred_at", "-id")
        constraints = [
            models.UniqueConstraint(
                fields=("owner", "external_id_hash"), name="imports_unique_row_per_owner"
            ),
        ]
        indexes = [models.Index(fields=("owner", "status"), name="imports_owner_status_idx")]

    def erase_sensitive_data(self):
        self.description = ""
        self.counterparty = ""
