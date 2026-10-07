import tempfile
from io import StringIO
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.test import SimpleTestCase

COMMITTED_SCHEMA = Path(settings.BASE_DIR).parent / "openapi" / "schema.yml"


class OpenApiSchemaTests(SimpleTestCase):
    def test_schema_is_generated_without_warnings(self):
        # fail_on_warn faz a geração falhar quando uma view fica sem serializer/tipo definido,
        # evitando que o contrato usado para gerar os tipos do frontend degrade em silêncio.
        call_command("spectacular", fail_on_warn=True, stdout=StringIO(), stderr=StringIO())

    def test_committed_schema_is_up_to_date(self):
        # openapi/schema.yml alimenta os tipos do frontend; regenerar com `make gen_api`.
        with tempfile.TemporaryDirectory() as folder:
            generated = Path(folder) / "schema.yml"
            call_command("spectacular", file=str(generated), stdout=StringIO(), stderr=StringIO())

            self.assertEqual(
                COMMITTED_SCHEMA.read_text(encoding="utf-8").splitlines(),
                generated.read_text(encoding="utf-8").splitlines(),
                "openapi/schema.yml desatualizado: rode `make gen_api`.",
            )
