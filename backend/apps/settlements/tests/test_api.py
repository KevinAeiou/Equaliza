from rest_framework import status
from rest_framework.test import APIClient

from apps.settlements.tests.test_services import SettlementScenario, month_start

BASE = "/api/settlements/"


class SettlementApiTests(SettlementScenario):
    def as_user(self, user):
        client = APIClient()
        client.force_authenticate(user)
        return client

    def post(self, user, **body):
        payload = {"receiver": self.ana.id, "amount": "40.00", "month": self.last.strftime("%Y-%m")}
        payload.update(body)

        return self.as_user(user).post(BASE, payload, format="json")

    def test_balance(self):
        response = self.as_user(self.bia).get(BASE + "balance/", {"month": self.last.strftime("%Y-%m")})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["my_balance"], "-100.00")
        self.assertEqual(response.data["suggestions"][0]["receiver"], self.ana.id)
        self.assertEqual(len(response.data["members"]), 3)

    def test_balance_rejects_invalid_month(self):
        response = self.as_user(self.bia).get(BASE + "balance/", {"month": "2026-13"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_balance_defaults_to_current_month(self):
        response = self.as_user(self.bia).get(BASE + "balance/")

        self.assertEqual(response.data["month"], month_start(0).strftime("%Y-%m"))

    def test_debtor_registers_payment(self):
        response = self.post(self.bia)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["payer"]["id"], self.bia.id)
        self.assertEqual(response.data["remaining_after"], "60.00")
        self.assertEqual(response.data["carried_to"], month_start(0).strftime("%Y-%m"))

    def test_payer_is_always_the_authenticated_user(self):
        response = self.post(self.bia, payer=self.cris.id)

        self.assertEqual(response.data["payer"]["id"], self.bia.id)

    def test_creditor_cannot_register(self):
        response = self.post(self.ana, receiver=self.bia.id)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_overpayment_is_rejected(self):
        self.assertEqual(self.post(self.bia, amount="100.01").status_code, 400)

    def test_history_with_filters_and_pagination(self):
        self.post(self.bia)
        client = self.as_user(self.ana)

        listed = client.get(BASE, {"status": "ACTIVE", "member": self.bia.id})
        paged = client.get(BASE, {"page_size": 10})
        other = client.get(BASE, {"status": "CANCELLED"})

        self.assertEqual(len(listed.data), 1)
        self.assertEqual(paged.data["count"], 1)
        self.assertEqual(other.data, [])

    def test_only_admins_can_cancel(self):
        settlement_id = self.post(self.bia).data["id"]

        denied = self.as_user(self.bia).post(f"{BASE}{settlement_id}/cancel/")
        allowed = self.as_user(self.ana).post(f"{BASE}{settlement_id}/cancel/")

        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(allowed.status_code, status.HTTP_200_OK)
        self.assertEqual(allowed.data["status"], "CANCELLED")

    def test_requires_authentication(self):
        self.assertEqual(APIClient().get(BASE).status_code, status.HTTP_401_UNAUTHORIZED)
