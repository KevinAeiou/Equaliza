import importlib
import os
from unittest import mock

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

BASE_ENV = {
    "SECRET_KEY": "chave-de-producao-longa-e-aleatoria",
    "ALLOWED_HOSTS": "api.equaliza.app, www.equaliza.app",
    "CORS_ALLOWED_ORIGINS": "https://equaliza.app,https://www.equaliza.app",
}


def load_production(env):
    with mock.patch.dict(os.environ, env, clear=True):
        module = importlib.import_module("config.settings.production")

        return importlib.reload(module)


class ProductionSettingsTests(SimpleTestCase):
    def test_lists_are_parsed_from_environment(self):
        settings = load_production(BASE_ENV)

        self.assertEqual(settings.ALLOWED_HOSTS, ["api.equaliza.app", "www.equaliza.app"])
        self.assertEqual(
            settings.CORS_ALLOWED_ORIGINS,
            ["https://equaliza.app", "https://www.equaliza.app"],
        )
        self.assertEqual(settings.CSRF_TRUSTED_ORIGINS, [])

    def test_internal_recurring_scheduler_is_off_by_default(self):
        self.assertFalse(load_production(BASE_ENV).RECURRING_SCHEDULER_ENABLED)

    def test_secret_key_is_required(self):
        with self.assertRaises(ImproperlyConfigured):
            load_production({"ALLOWED_HOSTS": "api.equaliza.app"})

    def test_insecure_secret_key_is_rejected(self):
        with self.assertRaises(ImproperlyConfigured):
            load_production({**BASE_ENV, "SECRET_KEY": "django-insecure-change-me"})

    def test_allowed_hosts_are_required(self):
        with self.assertRaises(ImproperlyConfigured):
            load_production({"SECRET_KEY": BASE_ENV["SECRET_KEY"]})
