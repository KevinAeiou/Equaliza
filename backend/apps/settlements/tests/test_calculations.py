import random
from decimal import Decimal

from django.test import SimpleTestCase

from apps.settlements.calculations import (
    ZERO,
    accumulate_balances,
    month_differences,
    month_quotas,
    split_proportionally,
    suggest_settlements,
)

D = Decimal


class SplitProportionallyTests(SimpleTestCase):
    def test_distributes_leftover_cents_to_largest_remainder(self):
        shares = split_proportionally(D("100.00"), {1: 1, 2: 1, 3: 1})

        self.assertEqual(sum(shares.values()), D("100.00"))
        self.assertEqual(sorted(shares.values()), [D("33.33"), D("33.33"), D("33.34")])

    def test_tie_goes_to_lowest_id(self):
        shares = split_proportionally(D("0.01"), {5: 1, 2: 1, 9: 1})

        self.assertEqual(shares, {2: D("0.01"), 5: ZERO, 9: ZERO})

    def test_proportional_to_weights(self):
        shares = split_proportionally(D("1000.00"), {1: D("3000"), 2: D("1000")})

        self.assertEqual(shares, {1: D("750.00"), 2: D("250.00")})

    def test_zero_weights_split_equally(self):
        shares = split_proportionally(D("10.00"), {1: 0, 2: 0})

        self.assertEqual(shares, {1: D("5.00"), 2: D("5.00")})

    def test_empty_weights(self):
        self.assertEqual(split_proportionally(D("10.00"), {}), {})


class MonthQuotasTests(SimpleTestCase):
    def test_proportional_to_income(self):
        quotas = month_quotas(D("600.00"), {1: D("4000"), 2: D("2000")}, [1, 2])

        self.assertEqual(quotas, {1: D("400.00"), 2: D("200.00")})

    def test_without_income_splits_equally_among_active(self):
        quotas = month_quotas(D("90.00"), {}, [1, 2, 3])

        self.assertEqual(quotas, {1: D("30.00"), 2: D("30.00"), 3: D("30.00")})

    def test_inactive_member_with_income_still_has_quota(self):
        quotas = month_quotas(D("100.00"), {1: D("1000"), 9: D("1000")}, [1])

        self.assertEqual(quotas, {1: D("50.00"), 9: D("50.00")})


class BalancesTests(SimpleTestCase):
    def test_month_differences(self):
        diffs = month_differences({1: D("300.00")}, {1: D("200.00"), 2: D("100.00")})

        self.assertEqual(diffs, {1: D("100.00"), 2: D("-100.00")})

    def test_accumulates_months_and_settlements(self):
        months = [{1: D("100.00"), 2: D("-100.00")}, {1: D("50.00"), 2: D("-50.00")}]

        balances = accumulate_balances(months, [(2, 1, D("100.00"))])

        self.assertEqual(balances, {1: D("50.00"), 2: D("-50.00")})

    def test_partial_payment_leaves_remainder(self):
        balances = accumulate_balances([{1: D("100.00"), 2: D("-100.00")}], [(2, 1, D("30.00"))])

        self.assertEqual(balances[2], D("-70.00"))

    def test_cancelled_settlement_is_simply_left_out(self):
        months = [{1: D("100.00"), 2: D("-100.00")}]

        self.assertEqual(accumulate_balances(months, [])[2], D("-100.00"))


class SuggestSettlementsTests(SimpleTestCase):
    def test_simple_pair(self):
        self.assertEqual(
            suggest_settlements({1: D("100.00"), 2: D("-100.00")}),
            [(2, 1, D("100.00"))],
        )

    def test_one_debtor_two_creditors(self):
        suggestions = suggest_settlements({1: D("60.00"), 2: D("40.00"), 3: D("-100.00")})

        self.assertEqual(suggestions, [(3, 1, D("60.00")), (3, 2, D("40.00"))])

    def test_settled_balances_have_no_suggestions(self):
        self.assertEqual(suggest_settlements({1: ZERO, 2: ZERO}), [])


class SumToZeroPropertyTests(SimpleTestCase):
    def test_balances_always_sum_to_zero_and_suggestions_settle_everyone(self):
        rng = random.Random(42)

        for _ in range(200):
            members = list(range(1, rng.randint(2, 6) + 1))
            months = []

            for _month in range(rng.randint(1, 4)):
                total = D(rng.randint(0, 500000)) / 100
                incomes = {
                    m: D(rng.randint(0, 800000)) / 100
                    for m in members
                    if rng.random() < 0.7
                }
                # Quem pagou: reparte o total em pedaços entre os membros.
                paid = split_proportionally(
                    total, {m: rng.randint(0, 5) for m in members}
                )
                quotas = month_quotas(total, incomes, members)

                self.assertEqual(sum(quotas.values()), total)
                months.append(month_differences(paid, quotas))

            balances = accumulate_balances(months)
            self.assertEqual(sum(balances.values()), ZERO)

            suggestions = suggest_settlements(balances)
            after = accumulate_balances(months, suggestions)

            self.assertTrue(all(value == ZERO for value in after.values()), after)
