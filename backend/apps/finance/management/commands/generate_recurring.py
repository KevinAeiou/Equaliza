from django.core.management.base import BaseCommand

from apps.finance.services import GenerateRecurringTransactionsService


class Command(BaseCommand):
    help = "Cria as despesas e receitas recorrentes que já venceram (rodar diariamente)."

    def handle(self, *args, **options):
        created = GenerateRecurringTransactionsService.execute()

        self.stdout.write(self.style.SUCCESS(f"{created} lançamento(s) criado(s)."))
