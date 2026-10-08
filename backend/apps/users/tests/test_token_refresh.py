from datetime import timedelta
from unittest import mock

from django.conf import settings
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from apps.users.models import User


class TokenRefreshTests(APITestCase):
    url = "/api/me/"

    def setUp(self):
        self.user = User.objects.create_user(email="ana@example.com", password="SenhaForte123")
        self.refresh = RefreshToken.for_user(self.user)

        expired = AccessToken.for_user(self.user)
        expired.set_exp(lifetime=-timedelta(minutes=5))

        self.client.cookies[settings.AUTH_COOKIE_ACCESS] = str(expired)
        self.client.cookies[settings.AUTH_COOKIE_REFRESH] = str(self.refresh)

    def test_expired_access_is_renewed_and_refresh_is_rotated(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        new_access = response.cookies[settings.AUTH_COOKIE_ACCESS].value
        new_refresh = response.cookies[settings.AUTH_COOKIE_REFRESH].value

        self.assertNotEqual(new_refresh, str(self.refresh))
        self.assertEqual(RefreshToken(new_refresh)["user_id"], str(self.user.pk))
        self.assertEqual(AccessToken(new_access)["user_id"], str(self.user.pk))

    def test_old_refresh_is_kept_by_default(self):
        self.client.get(self.url)

        self.assertFalse(BlacklistedToken.objects.exists())

    def test_old_refresh_is_blacklisted_when_enabled(self):
        with mock.patch.object(api_settings, "BLACKLIST_AFTER_ROTATION", True):
            response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(BlacklistedToken.objects.count(), 1)

    def test_without_rotation_refresh_cookie_is_not_replaced(self):
        with mock.patch.object(api_settings, "ROTATE_REFRESH_TOKENS", False):
            response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn(settings.AUTH_COOKIE_REFRESH, response.cookies)
