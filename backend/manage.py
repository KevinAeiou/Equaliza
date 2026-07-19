#!/usr/bin/env python3
"""Django's command-line utility for administrative tasks."""

import os
import sys
import environ
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))


def main():
    """Run administrative tasks."""
    django_env = env.str("DJANGO_ENV", default="development")
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", f"config.settings.{django_env}")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
