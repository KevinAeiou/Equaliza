from datetime import date, timedelta
from decimal import Decimal

from django.http import Http404
from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.families.enums import FamilyRole
from apps.families.models import Family, FamilyMember
from apps.finance.enums import CategoryType
from apps.finance.models import Expense, FinancialCategory, Income
from apps.settlements.enums import SettlementStatus
from apps.settlements.services import (
    BalanceService,
    CancelSettlementService,
    CreateSettlementService,
    ListSettlementService,
)
from apps.users.models import User

D = Decimal


def month_start(offset=0):
    today = timezone.localdate().replace(day=1)
    index = today.year * 12 + today.month - 1 + offset

    return date(index // 12, index % 12 + 1, 1)


class SettlementScenario(TestCase):
    """Ana ganha 3000 e Bia 1000 (cotas de 75% e 25%). Ana pagou 400 de despesas no mês anterior.

    Despesa total 400 → cota de Ana 300 e de Bia 100; Ana ficou com +100 e Bia com −100.
    """

    def setUp(self):
        self.ana = self.user("ana@example.com", FamilyRole.OWNER)
        self.bia = self.user("bia@example.com", FamilyRole.MEMBER)
        self.cris = self.user("cris@example.com", FamilyRole.ADMIN)
        self.family.settlement_start = month_start(-1)
        self.family.save()

        self.expense_cat = FinancialCategory.objects.create(name="Mercado", type=CategoryType.EXPENSE)
        self.income_cat = FinancialCategory.objects.create(name="Salário", type=CategoryType.INCOME)
        self.last = month_start(-1)

        self.income(self.ana, 3000)
        self.income(self.bia, 1000)
        self.expense(self.ana, 400)

    @property
    def family(self):
        if not hasattr(self, "_family"):
            self._family = Family.objects.create(name="Casa")
        return self._family

    def user(self, email, role):
        user = User.objects.create_user(email=email, password="x")
        FamilyMember.objects.create(family=self.family, user=user, role=role)
        user.current_family = self.family
        user.save()
        return user

    def income(self, user, amount, when=None):
        Income.objects.create(
            family=self.family, amount=D(amount), category=self.income_cat,
            date=when or self.last.replace(day=10), created_by=user,
        )

    def expense(self, user, amount, when=None):
        Expense.objects.create(
            family=self.family, amount=D(amount), category=self.expense_cat,
            date=when or self.last.replace(day=12), created_by=user,
        )

    def pay(self, user, receiver, amount, month=None, **extra):
        return CreateSettlementService.execute(
            user=user, receiver_id=receiver.id, amount=D(amount), month=month or self.last, **extra
        )

    def balance(self, month=None):
        result = BalanceService.compute(self.family, month or self.last)
        return {row["id"]: row for row in result["members"]}, result


class BalanceTests(SettlementScenario):
    def test_balance_by_member(self):
        rows, result = self.balance()

        self.assertEqual(rows[self.ana.id]["quota"], D("300.00"))
        self.assertEqual(rows[self.ana.id]["paid"], D("400.00"))
        self.assertEqual(rows[self.ana.id]["balance"], D("100.00"))
        self.assertEqual(rows[self.bia.id]["balance"], D("-100.00"))
        self.assertEqual(sum(row["balance"] for row in rows.values()), 0)
        self.assertEqual(
            [(s["payer"], s["receiver"], s["amount"]) for s in result["suggestions"]],
            [(self.bia.id, self.ana.id, D("100.00"))],
        )

    def test_months_before_start_do_not_generate_debt(self):
        self.family.settlement_start = month_start(0)
        self.family.save()

        rows, result = self.balance(month_start(0))

        self.assertTrue(all(row["balance"] == 0 for row in rows.values()))
        self.assertEqual(result["suggestions"], [])

    def test_month_without_income_splits_equally(self):
        Income.objects.all().delete()

        rows, _ = self.balance()

        self.assertEqual(rows[self.ana.id]["quota"], D("133.34"))
        self.assertEqual(rows[self.bia.id]["quota"], D("133.33"))
        self.assertEqual(rows[self.cris.id]["quota"], D("133.33"))

    def test_following_month_shows_previous_balance(self):
        rows, _ = self.balance(month_start(0))

        self.assertEqual(rows[self.bia.id]["previous_balance"], D("-100.00"))
        self.assertEqual(rows[self.bia.id]["balance"], D("-100.00"))

    def test_inactive_member_stays_while_balance_is_open(self):
        FamilyMember.objects.filter(user=self.bia).update(is_active=False)

        rows, _ = self.balance()

        self.assertIn(self.bia.id, rows)



class CreateSettlementTests(SettlementScenario):
    def test_registering_the_suggestions_zeroes_the_balances(self):
        suggestion = self.balance()[1]["suggestions"][0]

        self.pay(self.bia, self.ana, suggestion["amount"])

        rows, result = self.balance()
        self.assertTrue(all(row["balance"] == 0 for row in rows.values()))
        self.assertEqual(result["suggestions"], [])

    def test_partial_payment_reappears_as_previous_balance_next_month(self):
        settlement = self.pay(self.bia, self.ana, 30)

        self.assertEqual(settlement.remaining_after, D("70.00"))
        self.assertEqual(settlement.carried_to, month_start(0))

        rows, _ = self.balance(month_start(0))
        self.assertEqual(rows[self.bia.id]["previous_balance"], D("-70.00"))

    def test_full_payment_has_nothing_carried(self):
        settlement = self.pay(self.bia, self.ana, 100)

        self.assertEqual(settlement.remaining_after, 0)
        self.assertIsNone(settlement.carried_to)

    def test_cannot_exceed_debt_or_credit(self):
        with self.assertRaises(ValidationError):
            self.pay(self.bia, self.ana, "100.01")

    def test_cannot_overpay_after_partial_payment(self):
        self.pay(self.bia, self.ana, 60)

        with self.assertRaises(ValidationError):
            self.pay(self.bia, self.ana, 60)

    def test_creditor_cannot_pay(self):
        with self.assertRaises(ValidationError):
            self.pay(self.ana, self.bia, 10)

    def test_cannot_pay_oneself(self):
        with self.assertRaises(ValidationError):
            self.pay(self.bia, self.bia, 10)

    def test_receiver_must_be_in_the_family(self):
        stranger = User.objects.create_user(email="x@example.com", password="x")

        with self.assertRaises(ValidationError):
            self.pay(self.bia, stranger, 10)

    def test_amount_must_be_positive(self):
        with self.assertRaises(ValidationError):
            self.pay(self.bia, self.ana, 0)

    def test_month_cannot_be_future_or_before_start(self):
        with self.assertRaises(ValidationError):
            self.pay(self.bia, self.ana, 10, month=month_start(1))

        with self.assertRaises(ValidationError):
            self.pay(self.bia, self.ana, 10, month=month_start(-2))

    def test_payment_date_cannot_be_future(self):
        with self.assertRaises(ValidationError):
            self.pay(self.bia, self.ana, 10, paid_at=timezone.localdate() + timedelta(days=1))

    def test_user_without_family_is_denied(self):
        loner = User.objects.create_user(email="solo@example.com", password="x")

        with self.assertRaises(PermissionDenied):
            self.pay(loner, self.ana, 10)

    def test_settlements_are_not_income_or_expense(self):
        self.pay(self.bia, self.ana, 50)

        self.assertEqual(Expense.objects.count(), 1)
        self.assertEqual(Income.objects.count(), 2)


class CancelSettlementTests(SettlementScenario):
    def test_cancel_restores_the_balance_and_keeps_history(self):
        settlement = self.pay(self.bia, self.ana, 100)

        CancelSettlementService.execute(user=self.ana, settlement_id=settlement.id)

        settlement.refresh_from_db()
        self.assertEqual(settlement.status, SettlementStatus.CANCELLED)
        self.assertEqual(settlement.cancelled_by, self.ana)
        self.assertIsNotNone(settlement.cancelled_at)
        self.assertEqual(self.balance()[0][self.bia.id]["balance"], D("-100.00"))

    def test_admin_can_cancel(self):
        settlement = self.pay(self.bia, self.ana, 10)

        CancelSettlementService.execute(user=self.cris, settlement_id=settlement.id)

    def test_regular_member_cannot_cancel_even_their_own(self):
        settlement = self.pay(self.bia, self.ana, 10)

        with self.assertRaises(PermissionDenied):
            CancelSettlementService.execute(user=self.bia, settlement_id=settlement.id)

    def test_cannot_cancel_twice(self):
        settlement = self.pay(self.bia, self.ana, 10)
        CancelSettlementService.execute(user=self.ana, settlement_id=settlement.id)

        with self.assertRaises(ValidationError):
            CancelSettlementService.execute(user=self.ana, settlement_id=settlement.id)

    def test_other_family_settlement_is_not_found(self):
        other = Family.objects.create(name="Outra")
        boss = User.objects.create_user(email="boss@example.com", password="x", current_family=other)
        FamilyMember.objects.create(family=other, user=boss, role=FamilyRole.OWNER)
        settlement = self.pay(self.bia, self.ana, 10)

        with self.assertRaises(Http404):
            CancelSettlementService.execute(user=boss, settlement_id=settlement.id)


class ListSettlementTests(SettlementScenario):
    def test_filters(self):
        first = self.pay(self.bia, self.ana, 10)
        second = self.pay(self.bia, self.ana, 20)
        CancelSettlementService.execute(user=self.ana, settlement_id=second.id)

        everything = ListSettlementService.execute(self.ana)
        active = ListSettlementService.execute(self.ana, status=SettlementStatus.ACTIVE)
        by_member = ListSettlementService.execute(self.ana, member=self.cris.id)
        by_month = ListSettlementService.execute(self.ana, month=month_start(0))

        self.assertEqual(everything.count(), 2)
        self.assertEqual(list(active), [first])
        self.assertEqual(by_member.count(), 0)
        self.assertEqual(by_month.count(), 0)
