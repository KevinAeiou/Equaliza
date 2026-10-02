from django.core import mail
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User


class PasswordResetTests(APITestCase):
    request_url = "/api/password-reset/"
    confirm_url = "/api/password-reset/confirm/"

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(email="ana@example.com", password="SenhaAntiga123")

    def credentials(self):
        body = mail.outbox[0].body
        query = body.split("/reset-password?")[1].split()[0]
        return dict(p.split("=") for p in query.split("&"))

    def test_request_sends_email(self):
        response = self.client.post(self.request_url, {"email": "ana@example.com"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["ana@example.com"])

    def test_request_unknown_email_is_silent(self):
        response = self.client.post(self.request_url, {"email": "x@example.com"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

    def test_confirm_changes_password_and_token_is_single_use(self):
        self.client.post(self.request_url, {"email": "ana@example.com"})
        creds = self.credentials()
        data = {**creds, "password": "NovaSenha!2026"}

        response = self.client.post(self.confirm_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NovaSenha!2026"))

        again = self.client.post(self.confirm_url, {**creds, "password": "Outra!Senha2026"})
        self.assertEqual(again.status_code, status.HTTP_400_BAD_REQUEST)

    def test_confirm_invalid_token(self):
        self.client.post(self.request_url, {"email": "ana@example.com"})
        creds = self.credentials()
        response = self.client.post(
            self.confirm_url, {"uid": creds["uid"], "token": "invalido", "password": "NovaSenha!2026"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_confirm_weak_password(self):
        self.client.post(self.request_url, {"email": "ana@example.com"})
        response = self.client.post(self.confirm_url, {**self.credentials(), "password": "123"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)
