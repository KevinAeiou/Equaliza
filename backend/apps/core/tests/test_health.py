from unittest import mock

from django.db.utils import OperationalError
from rest_framework import status
from rest_framework.test import APITestCase


class HealthCheckTests(APITestCase):
    url = "/api/health/"

    def test_ok_without_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_unavailable_when_database_fails(self):
        with mock.patch("apps.core.views.connection.cursor", side_effect=OperationalError("down")):
            with self.assertLogs("apps.core.views", level="ERROR"):
                response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.json(), {"status": "unavailable"})
