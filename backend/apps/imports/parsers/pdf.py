"""Leitura de texto de PDF em um processo separado e limitado.

Bibliotecas de PDF são alvo comum de arquivos malformados. Por isso a extração roda em outro
processo, com limite de memória, de CPU e de tempo, sem poder gravar arquivos, sem herdar o
ambiente do servidor (chaves, senhas do banco) e sem acesso às variáveis de configuração.
"""

import json
import os
import resource
import subprocess
import sys
from pathlib import Path

from django.conf import settings

from apps.imports.parsers.errors import ParseError, PasswordRequired, WrongPassword

WORKER = Path(__file__).with_name("pdf_worker.py")
MEMORY_LIMIT = 512 * 1024 * 1024
CPU_SECONDS = 15
WALL_SECONDS = 25
MAX_OUTPUT = 4 * 1024 * 1024

ERRORS = {
    "too_many_pages": "O PDF tem páginas demais.",
    "too_large": "O PDF tem texto demais.",
    "invalid": "Não foi possível ler o PDF.",
}


def is_pdf(content):
    return content.lstrip()[:5] == b"%PDF-"


def limit_resources():
    """Roda no processo filho, antes de ele executar o worker."""
    resource.setrlimit(resource.RLIMIT_AS, (MEMORY_LIMIT, MEMORY_LIMIT))
    resource.setrlimit(resource.RLIMIT_CPU, (CPU_SECONDS, CPU_SECONDS))
    resource.setrlimit(resource.RLIMIT_FSIZE, (0, 0))
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    os.setsid()


def extract_pdf_text(content, password=None):
    header = json.dumps({
        "password": password or "",
        "max_pages": settings.IMPORT_PDF_MAX_PAGES,
        "max_chars": MAX_OUTPUT,
    }).encode("utf-8")

    try:
        done = subprocess.run(
            # -I: modo isolado (ignora variáveis PYTHON* e o diretório atual).
            [sys.executable, "-I", str(WORKER)],
            input=header + b"\n" + content,
            capture_output=True,
            timeout=WALL_SECONDS,
            env={},  # nada do ambiente do servidor chega ao worker
            cwd="/",
            preexec_fn=limit_resources,
        )
    except (subprocess.TimeoutExpired, OSError, ValueError):
        raise ParseError("Não foi possível ler o PDF.") from None

    if done.returncode != 0 or len(done.stdout) > MAX_OUTPUT * 2:
        raise ParseError("Não foi possível ler o PDF.")

    try:
        answer = json.loads(done.stdout)
    except ValueError:
        raise ParseError("Não foi possível ler o PDF.") from None

    code = answer.get("error")

    if code == "password_required":
        raise PasswordRequired("Informe a senha do arquivo.")

    if code == "wrong_password":
        raise WrongPassword("Senha incorreta.")

    if code:
        raise ParseError(ERRORS.get(code, ERRORS["invalid"]))

    return answer.get("text", "")
