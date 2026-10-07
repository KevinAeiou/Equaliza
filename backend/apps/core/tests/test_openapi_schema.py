from io import StringIO

from django.core.management import call_command
from django.test import SimpleTestCase


class OpenApiSchemaTests(SimpleTestCase):
    def test_schema_is_generated_without_warnings(self):
        # fail_on_warn faz a geração falhar quando uma view fica sem serializer/tipo definido,
        # evitando que o contrato usado para gerar os tipos do frontend degrade em silêncio.
        call_command("spectacular", fail_on_warn=True, stdout=StringIO(), stderr=StringIO())
