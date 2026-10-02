import os
import sys

from django.apps import AppConfig


class FinanceConfig(AppConfig):
    name = 'apps.finance'

    def ready(self):
        # O autoreload do runserver sobe dois processos; só o filho (RUN_MAIN) deve agendar.
        if "runserver" in sys.argv and os.environ.get("RUN_MAIN") != "true":
            return

        from .scheduler import start_scheduler

        start_scheduler()
