from django.core.management.base import BaseCommand

from apps.imports.services import PurgePendingService


class Command(BaseCommand):
    help = "Expira as pendências de importação vencidas e apaga seus dados sensíveis (rodar diariamente)."

    def handle(self, *args, **options):
        expired, erased = PurgePendingService.execute()

        self.stdout.write(self.style.SUCCESS(f"{expired} expirada(s); {erased} com dados apagados."))
