import json
import logging

from django.conf import settings

from apps.imports.enums import ImportFormat, ImportSource
from apps.imports.exceptions import FileTooLarge
from apps.imports.parsed import ParsedRow, validate_upload
from apps.imports.parsers import ParseError
from apps.imports.parsers.c6_statement import parse_c6_statement_text
from apps.imports.parsers.flags import detect_flag
from apps.imports.parsers.pdf import extract_pdf_text, is_pdf
from apps.imports.services.create_batch import CreateImportBatchService
from apps.imports.services.translate import api_errors

logger = logging.getLogger(__name__)


class PdfStatementService:
    """Extrato em PDF: leitura em duas etapas, sem guardar nada entre elas.

    1. `preview` lê o PDF e devolve as linhas, para o usuário revisar. Nada é gravado.
    2. `confirm` recebe as linhas revisadas e cria o lote.
    """

    @classmethod
    def preview(cls, uploaded_file, password=None):
        if uploaded_file.size > settings.IMPORT_MAX_FILE_BYTES:
            raise FileTooLarge()

        content = uploaded_file.read()

        with api_errors():
            validate_upload(content)

            if not is_pdf(content):
                raise ParseError("O arquivo não é um PDF.")

            result = parse_c6_statement_text(extract_pdf_text(content, password or None))

            if len(result.rows) > settings.IMPORT_MAX_ROWS:
                raise ParseError("Arquivo com linhas demais.")

        logger.info("Pré-visualização de PDF: linhas=%s confere=%s", len(result.rows), result.matches)

        return result

    @classmethod
    def confirm(cls, owner, rows, account_ref=""):
        parsed = [
            ParsedRow(
                direction=row["direction"],
                amount=row["amount"],
                occurred_at=row["date"],
                description=row.get("description", ""),
                kind=row.get("kind", ""),
                account_ref=account_ref,
                # O sinalizador é sempre recalculado aqui: não se confia no que o cliente devolve.
                flag=detect_flag(row.get("description", "")),
            )
            for row in rows
        ]
        # Sem arquivo guardado, o hash do lote vem do conteúdo revisado.
        canonical = json.dumps(
            [[str(row.occurred_at), str(row.amount), row.direction, row.description] for row in parsed],
            ensure_ascii=False,
        ).encode("utf-8")

        with api_errors():
            batch = CreateImportBatchService.execute(
                owner, ImportSource.STATEMENT, ImportFormat.PDF, canonical, parsed
            )

        logger.info("Importação de PDF confirmada: lote=%s novas=%s repetidas=%s", batch.pk, batch.rows_new, batch.rows_duplicated)

        return batch
