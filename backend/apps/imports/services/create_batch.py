import hashlib
import hmac
from collections import Counter
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.imports.enums import PendingStatus
from apps.imports.models import ImportBatch, PendingTransaction


class UploadRejected(Exception):
    """Arquivo recusado. A mensagem é genérica de propósito: nunca expõe trechos do conteúdo."""


@dataclass
class ParsedRow:
    direction: str
    amount: Decimal
    occurred_at: date
    description: str = ""
    external_id: str = ""
    kind: str = ""
    account_ref: str = ""
    source_category: str = ""
    counterparty: str = ""
    flag: str = ""


def validate_upload(content):
    if not content:
        raise UploadRejected("Arquivo vazio.")

    if len(content) > settings.IMPORT_MAX_FILE_BYTES:
        raise UploadRejected("Arquivo grande demais.")


def row_hash(owner_id, row, occurrence):
    """Chave de deduplicação: o id do banco, ou as características da linha mais a ordem entre idênticas."""
    account = row.account_ref[-4:]

    if row.external_id:
        parts = (owner_id, account, row.external_id)
    else:
        parts = (
            owner_id, account, row.occurred_at.isoformat(), f"{row.amount:.2f}",
            row.direction, row.description.strip().lower(), occurrence,
        )

    message = "|".join(str(part) for part in parts).encode("utf-8")

    return hmac.new(settings.SECRET_KEY.encode("utf-8"), message, hashlib.sha256).hexdigest()


class CreateImportBatchService:
    @classmethod
    @transaction.atomic
    def execute(cls, owner, source, file_format, content, rows):
        if len(rows) > settings.IMPORT_MAX_ROWS:
            raise UploadRejected("Arquivo com linhas demais.")

        seen = Counter()
        hashes = []

        for row in rows:
            key = (row.account_ref, row.occurred_at, row.amount, row.direction, row.description)
            seen[key] += 1
            hashes.append(row_hash(owner.pk, row, seen[key]))

        existing = set(
            PendingTransaction.objects.filter(owner=owner, external_id_hash__in=hashes)
            .values_list("external_id_hash", flat=True)
        )
        dates = [row.occurred_at for row in rows]
        batch = ImportBatch.objects.create(
            owner=owner,
            source=source,
            format=file_format,
            file_hash=hashlib.sha256(content).hexdigest(),
            period_start=min(dates, default=None),
            period_end=max(dates, default=None),
            rows_total=len(rows),
        )
        expires_at = timezone.now() + timedelta(days=settings.IMPORT_RETENTION_DAYS)
        new_rows = []
        batch_hashes = set()

        for row, digest in zip(rows, hashes):
            if digest in existing or digest in batch_hashes:
                continue

            batch_hashes.add(digest)
            new_rows.append(
                PendingTransaction(
                    owner=owner,
                    batch=batch,
                    external_id_hash=digest,
                    direction=row.direction,
                    kind=row.kind[:60],
                    account_ref=row.account_ref[-4:],
                    source_category=row.source_category[:100],
                    amount=abs(row.amount),
                    occurred_at=row.occurred_at,
                    description=row.description,
                    counterparty=row.counterparty,
                    flag=row.flag,
                    status=PendingStatus.PENDING,
                    expires_at=expires_at,
                )
            )

        PendingTransaction.objects.bulk_create(new_rows)
        batch.rows_new = len(new_rows)
        batch.rows_duplicated = len(rows) - len(new_rows)
        batch.save(update_fields=("rows_new", "rows_duplicated"))

        return batch
