from django.core.management import call_command
from django.test import TestCase

from apps.families.models import Family
from apps.settlements.enums import SettlementStatus
from apps.settlements.models import Settlement
from apps.settlements.services import BalanceService
from apps.settlements.tests.test_services import month_start


class SeedDemoSettlementsTests(TestCase):
    def test_seed_creates_history_and_settles_the_oldest_months(self):
        call_command("seed_demo", force=True, verbosity=0)

        family = Family.objects.get(name="Família Souza")
        oldest = family.settlement_start

        self.assertTrue(Settlement.objects.filter(family=family, status=SettlementStatus.CANCELLED).exists())
        self.assertTrue(Settlement.objects.filter(family=family, remaining_after__gt=0).exists())

        # Quitar as sugestões de cada mês zera o saldo: depois do seed, o mês mais antigo está em dia.
        balances = BalanceService.user_balances(family, oldest)
        self.assertTrue(all(value == 0 for value in balances.values()))

        # Os meses recentes seguem em aberto.
        current = BalanceService.compute(family, month_start(0))
        self.assertTrue(current["suggestions"])

    def test_registering_the_seed_suggestions_zeroes_the_balances(self):
        from apps.settlements.services import CreateSettlementService
        from apps.users.models import User

        call_command("seed_demo", force=True, verbosity=0)

        family = Family.objects.get(name="Família Souza")
        month = month_start(0)

        for suggestion in BalanceService.compute(family, month)["suggestions"]:
            CreateSettlementService.execute(
                user=User.objects.get(pk=suggestion["payer"]),
                receiver_id=suggestion["receiver"],
                amount=suggestion["amount"],
                month=month,
            )

        balances = BalanceService.user_balances(family, month)
        self.assertTrue(all(value == 0 for value in balances.values()), balances)
