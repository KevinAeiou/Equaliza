from django.conf import settings
from django.db import models


class CsvMapping(models.Model):
    """Mapeamento de colunas salvo pelo usuário para CSVs de bancos sem modelo pronto."""

    DELIMITERS = ((";", "Ponto e vírgula"), (",", "Vírgula"), ("\t", "Tabulação"))
    DATE_FORMATS = (("%d/%m/%Y", "dd/mm/aaaa"), ("%Y-%m-%d", "aaaa-mm-dd"), ("%d-%m-%Y", "dd-mm-aaaa"))
    DECIMALS = (("COMMA", "1.234,56"), ("DOT", "1,234.56"))

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="csv_mappings"
    )
    name = models.CharField(max_length=80)
    delimiter = models.CharField(max_length=1, choices=DELIMITERS, blank=True)
    date_column = models.CharField(max_length=100)
    amount_column = models.CharField(max_length=100)
    description_column = models.CharField(max_length=100)
    date_format = models.CharField(max_length=10, choices=DATE_FORMATS, default="%d/%m/%Y")
    decimal_separator = models.CharField(max_length=5, choices=DECIMALS, default="COMMA")
    debit_is_negative = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("name",)
        constraints = [
            models.UniqueConstraint(fields=("owner", "name"), name="imports_unique_mapping_name")
        ]

    def to_layout(self):
        from apps.imports.parsers.csv_parser import CsvLayout, normalize

        return CsvLayout(
            name=self.name,
            date=normalize(self.date_column),
            amount=normalize(self.amount_column),
            description=normalize(self.description_column),
            date_format=self.date_format,
            decimal=self.decimal_separator,
            debit_is_negative=self.debit_is_negative,
            delimiter=self.delimiter,
        )
