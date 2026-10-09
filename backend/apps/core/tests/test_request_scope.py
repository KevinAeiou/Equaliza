from rest_framework import status
from rest_framework.test import APITestCase


class RequestScopeTests(APITestCase):
    def test_path_outside_scope_is_not_found(self):
        for path in ("/", "/.env", "/wp-login.php", "/apiv2/health/", "/phpmyadmin/"):
            with self.subTest(path=path):
                response = self.client.get(path)

                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_method_outside_scope_is_not_allowed(self):
        for method in ("TRACE", "CONNECT", "PROPFIND"):
            with self.subTest(method=method):
                response = self.client.generic(method, "/api/health/")

                self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_api_path_still_reaches_the_views(self):
        self.assertEqual(self.client.get("/api/health/").status_code, status.HTTP_200_OK)

    def test_unknown_path_inside_scope_is_handled_by_django(self):
        response = self.client.get("/api/nao-existe/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
