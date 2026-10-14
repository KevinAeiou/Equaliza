from apps.imports.enums import ImportFormat
from apps.imports.parsers.archive import is_zip, read_single_csv
from apps.imports.parsers.csv_parser import parse_csv
from apps.imports.parsers.errors import UnsupportedFormat
from apps.imports.parsers.ofx import looks_like_ofx, parse_ofx
from apps.imports.parsed import validate_upload


def parse_upload(content, password=None, layout=None, max_rows=None):
    """Detecta o formato pelo conteúdo (nunca pela extensão) e devolve `(formato, linhas, origem)`.

    `origem` é a fonte sugerida pelo arquivo (extrato ou fatura), quando ele a revela.
    """
    validate_upload(content)

    if is_zip(content):
        content = read_single_csv(content, password)

    if looks_like_ofx(content):
        result = parse_ofx(content, max_rows=max_rows)

        return ImportFormat.OFX, result.rows, result.source_hint

    if content.lstrip()[:5] == b"%PDF-":
        raise UnsupportedFormat("PDF precisa de revisão antes de gravar: use a importação de PDF.")

    used, rows = parse_csv(content, layout=layout, max_rows=max_rows)

    return ImportFormat.CSV, rows, used.source
