"""Abre, em memória, o ZIP com senha da fatura do C6, com limites contra bomba de compressão."""

import io
import zipfile

from django.conf import settings

from apps.imports.parsers.errors import ParseError, PasswordRequired, WrongPassword

ZIP_MAGIC = b"PK\x03\x04"
MAX_COMPRESSION_RATIO = 100


def is_zip(content):
    return content.startswith(ZIP_MAGIC)


def read_single_csv(content, password=None):
    """Devolve o único CSV do ZIP. Qualquer outra estrutura é recusada."""
    limit = settings.IMPORT_MAX_FILE_BYTES

    try:
        archive = zipfile.ZipFile(io.BytesIO(content))
    except zipfile.BadZipFile:
        raise ParseError("Arquivo compactado inválido.") from None

    with archive:
        infos = archive.infolist()

        if len(infos) != 1 or infos[0].is_dir() or not infos[0].filename.lower().endswith(".csv"):
            raise ParseError("O arquivo compactado deve conter um único CSV.")

        info = infos[0]

        if info.file_size > limit or (
            info.compress_size and info.file_size / info.compress_size > MAX_COMPRESSION_RATIO
        ):
            raise ParseError("Arquivo compactado grande demais.")

        encrypted = bool(info.flag_bits & 0x1)

        if encrypted and not password:
            raise PasswordRequired("Informe a senha do arquivo.")

        try:
            # A leitura é limitada mesmo que o cabeçalho minta sobre o tamanho.
            with archive.open(info, pwd=password.encode("utf-8") if password else None) as handle:
                data = handle.read(limit + 1)
        except RuntimeError:
            raise WrongPassword("Senha incorreta.") from None
        except (zipfile.BadZipFile, NotImplementedError, EOFError, OSError):
            # NotImplementedError: criptografia AES ou compressão não suportada.
            raise ParseError("Não foi possível abrir o arquivo compactado.") from None

    if len(data) > limit:
        raise ParseError("Arquivo compactado grande demais.")

    return data
