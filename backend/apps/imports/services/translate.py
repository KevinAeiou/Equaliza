from contextlib import contextmanager

from apps.imports.exceptions import (
    ImportRejected,
    MappingNeeded,
    PasswordNeeded,
    UnsupportedFile,
    WrongFilePassword,
)
from apps.imports.parsed import UploadRejected
from apps.imports.parsers import (
    NeedsMapping,
    ParseError,
    PasswordRequired,
    UnsupportedFormat,
    WrongPassword,
)


@contextmanager
def api_errors():
    """Converte os erros de leitura em respostas da API, sem nunca repassar trechos do arquivo."""
    try:
        yield
    except PasswordRequired:
        raise PasswordNeeded() from None
    except WrongPassword:
        raise WrongFilePassword() from None
    except NeedsMapping as error:
        raise MappingNeeded(error.headers) from None
    except UnsupportedFormat as error:
        raise UnsupportedFile(detail=str(error)) from None
    except (ParseError, UploadRejected) as error:
        raise ImportRejected(detail=str(error)) from None
