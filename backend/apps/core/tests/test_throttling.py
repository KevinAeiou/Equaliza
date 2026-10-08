from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.throttling import ScopedRateThrottle

from apps.users.views.password_reset import PasswordResetThrottle

RATES = {
    "login": "2/min",
    "register": "2/min",
    "password_reset": "2/min",
    "invitation_validate": "2/min",
}

TOKEN = "00000000-0000-0000-0000-000000000000"

ENDPOINTS = {
    "login": ("post", "/api/login/", {"email": "x@example.com", "password": "errada"}),
    "register": ("post", "/api/register/", {}),
    "password_reset": ("post", "/api/password-reset/", {"email": "x@example.com"}),
    "invitation_validate": ("get", f"/api/invitations/{TOKEN}/validate/", None),
}


class PublicRouteThrottlingTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)

        for throttle in (ScopedRateThrottle, PasswordResetThrottle):
            original = throttle.THROTTLE_RATES
            throttle.THROTTLE_RATES = RATES
            self.addCleanup(setattr, throttle, "THROTTLE_RATES", original)

    def test_public_routes_are_throttled(self):
        for scope, (method, url, data) in ENDPOINTS.items():
            with self.subTest(scope=scope):
                cache.clear()
                call = getattr(self.client, method)

                for _ in range(2):
                    response = call(url, data) if data is not None else call(url)
                    self.assertNotEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

                response = call(url, data) if data is not None else call(url)
                self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
