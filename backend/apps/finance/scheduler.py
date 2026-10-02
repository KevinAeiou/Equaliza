import logging
import sys
import threading

from django.conf import settings
from django.db import close_old_connections

logger = logging.getLogger(__name__)

SERVER_COMMANDS = ("gunicorn", "runserver", "daphne", "uvicorn")


class RecurringScheduler:
    """Thread em segundo plano que registra periodicamente as finanças recorrentes vencidas.

    Vários processos (ex.: workers do gunicorn) podem rodar o agendador ao mesmo tempo: o
    service trava as linhas com select_for_update, então cada ocorrência é criada uma só vez.
    """

    def __init__(self, interval, initial_delay=0):
        self.interval = interval
        self.initial_delay = initial_delay
        self._stop = threading.Event()
        self._thread = None

    def run_once(self):
        from apps.finance.services import GenerateRecurringTransactionsService

        close_old_connections()

        try:
            created = GenerateRecurringTransactionsService.execute()
        except Exception:
            logger.exception("Falha ao gerar finanças recorrentes.")
            return 0
        finally:
            close_old_connections()

        if created:
            logger.info("Agendador criou %s lançamento(s) recorrente(s).", created)

        return created

    def _loop(self):
        if self._stop.wait(self.initial_delay):
            return

        while True:
            self.run_once()

            if self._stop.wait(self.interval):
                return

    def start(self):
        if self._thread and self._thread.is_alive():
            return

        self._stop.clear()
        self._thread = threading.Thread(target=self._loop, name="recurring-scheduler", daemon=True)
        self._thread.start()

    def stop(self):
        self._stop.set()

        if self._thread:
            self._thread.join(timeout=5)


_scheduler = None


def is_server_process(argv=None):
    argv = argv or sys.argv
    return any(command in arg for arg in argv[:2] for command in SERVER_COMMANDS)


def start_scheduler():
    """Inicia o agendador (uma vez por processo) se estiver habilitado e for um servidor web."""
    global _scheduler

    if not settings.RECURRING_SCHEDULER_ENABLED or _scheduler or not is_server_process():
        return None

    _scheduler = RecurringScheduler(
        interval=settings.RECURRING_SCHEDULER_INTERVAL,
        initial_delay=settings.RECURRING_SCHEDULER_INITIAL_DELAY,
    )
    _scheduler.start()

    return _scheduler
