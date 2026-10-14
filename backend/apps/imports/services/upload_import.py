import logging

from django.conf import settings

from apps.imports.exceptions import (
    FileTooLarge,
    ImportRejected,
    MappingNeeded,
    PasswordNeeded,
    UnsupportedFile,
    WrongFilePassword,
)
from apps.imports.parsers import (
    NeedsMapping,
    ParseError,
    PasswordRequired,
    UnsupportedFormat,
    WrongPassword,
    parse_upload,
)
from apps.imports.services.create_batch import CreateImportBatchService, UploadRejected

logger = logging.getLogger(__name__)


class UploadImportService:
    """Lê o arquivo em memória, cria o lote e descarta o conteúdo. Nada do arquivo é registrado em log."""

    @classmethod
    def execute(cls, owner, uploaded_file, source, password=None, layout=None):
        if uploaded_file.size > settings.IMPORT_MAX_FILE_BYTES:
            raise FileTooLarge()

        content = uploaded_file.read()

        try:
            file_format, rows, hint = parse_upload(
                content, password=password or None, layout=layout, max_rows=settings.IMPORT_MAX_ROWS
            )

            if hint and hint != source:
                raise ParseError("O tipo do arquivo não confere com o escolhido.")

            batch = CreateImportBatchService.execute(owner, source, file_format, content, rows)
        except PasswordRequired:
            raise PasswordNeeded() from None
        except WrongPassword:
            raise WrongFilePassword() from None
        except NeedsMapping as error:
            raise MappingNeeded(error.headers) from None
        except UnsupportedFormat:
            raise UnsupportedFile() from None
        except (ParseError, UploadRejected) as error:
            raise ImportRejected(detail=str(error)) from None

        logger.info("Importação concluída: lote=%s novas=%s repetidas=%s", batch.pk, batch.rows_new, batch.rows_duplicated)

        return batch
