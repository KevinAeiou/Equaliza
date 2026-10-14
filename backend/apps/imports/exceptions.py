from rest_framework import status
from rest_framework.exceptions import APIException


class ImportRejected(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "import_rejected"
    default_detail = "Não foi possível processar o arquivo."


class FileTooLarge(ImportRejected):
    status_code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    default_code = "file_too_large"
    default_detail = "Arquivo grande demais."


class UnsupportedFile(ImportRejected):
    status_code = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
    default_code = "unsupported_format"
    default_detail = "Formato de arquivo não aceito."


class PasswordNeeded(ImportRejected):
    default_code = "password_required"
    default_detail = "Informe a senha do arquivo."


class WrongFilePassword(ImportRejected):
    default_code = "wrong_password"
    default_detail = "Senha incorreta."


class MappingNeeded(ImportRejected):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_code = "needs_mapping"

    def __init__(self, headers):
        super().__init__(detail={"detail": "Informe o mapeamento das colunas.", "headers": headers})


class PendingConflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "pending_conflict"
    default_detail = "Esta pendência não pode ser registrada."
