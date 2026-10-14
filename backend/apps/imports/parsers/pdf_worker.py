"""Processo isolado que extrai o texto de um PDF. NÃO importa Django nem nada do projeto.

Protocolo: a entrada padrão traz uma linha de JSON (`{"password": ..., "max_pages": N, "max_chars": N}`)
seguida dos bytes do PDF; a saída é uma linha de JSON com `{"text": ...}` ou `{"error": "<código>"}`.
A senha vai pela entrada padrão (nunca por argumento nem variável de ambiente) e só existe em memória.
"""

import io
import json
import sys


def fail(code):
    sys.stdout.write(json.dumps({"error": code}))
    sys.exit(0)


def main():
    header = json.loads(sys.stdin.buffer.readline())
    content = sys.stdin.buffer.read()

    from pypdf import PdfReader
    from pypdf.errors import PyPdfError

    try:
        reader = PdfReader(io.BytesIO(content))

        if reader.is_encrypted and not reader.decrypt(header.get("password") or ""):
            fail("wrong_password" if header.get("password") else "password_required")

        if len(reader.pages) > header["max_pages"]:
            fail("too_many_pages")

        parts = []
        total = 0

        for page in reader.pages:
            text = page.extract_text() or ""
            total += len(text)

            if total > header["max_chars"]:
                fail("too_large")

            parts.append(text)
    except SystemExit:
        raise
    except (PyPdfError, ValueError, KeyError, TypeError, OSError, RecursionError):
        fail("invalid")

    sys.stdout.write(json.dumps({"text": "\n".join(parts)}))


if __name__ == "__main__":
    main()
