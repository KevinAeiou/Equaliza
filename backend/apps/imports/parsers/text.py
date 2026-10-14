from apps.imports.parsers.errors import ParseError


def decode_text(content):
    """UTF-8 (com ou sem BOM) primeiro; se falhar, Windows-1252, como o Excel grava."""
    if b"\x00" in content:
        raise ParseError("Arquivo inválido.")

    try:
        return content.decode("utf-8-sig")
    except UnicodeDecodeError:
        return content.decode("cp1252", errors="replace")
