from datetime import timedelta
from unittest import mock

from django.test import TestCase, override_settings
from django.utils import timezone

from apps.families.models import Family
from apps.finance import scheduler
from apps.finance.enums import CategoryType, RecurrenceFrequency
from apps.finance.models import Expense, FinancialCategory, RecurringTransaction
from apps.finance.scheduler import RecurringScheduler, is_server_process, start_scheduler
from apps.users.models import User


class RecurringSchedulerTests(TestCase):
    def setUp(self):
        self.family = Family.objects.create(name="Família Teste")
        self.user = User.objects.create_user(email="a@example.com", password="senha-teste", first_name="A")
        self.category = FinancialCategory.objects.create(name="Moradia", type=CategoryType.EXPENSE)
        scheduler._scheduler = None

    def test_run_once_creates_due_entries_and_is_idempotent(self):
        start = timezone.localdate() - timedelta(days=14)
        RecurringTransaction.objects.create(
            family=self.family, type=CategoryType.EXPENSE, amount=100, description="Aluguel",
            category=self.category, frequency=RecurrenceFrequency.WEEKLY, start_date=start,
            next_date=start, created_by=self.user, updated_by=self.user,
        )
        runner = RecurringScheduler(interval=1)

        self.assertEqual(runner.run_once(), 3)
        self.assertEqual(runner.run_once(), 0)
        self.assertEqual(Expense.objects.count(), 3)

    def test_run_once_swallows_errors(self):
        target = "apps.finance.services.GenerateRecurringTransactionsService.execute"

        with mock.patch(target, side_effect=RuntimeError("boom")):
            self.assertEqual(RecurringScheduler(interval=1).run_once(), 0)

    def test_thread_runs_and_stops(self):
        runner = RecurringScheduler(interval=3600)

        with mock.patch.object(RecurringScheduler, "run_once") as run_once:
            runner.start()
            runner._stop.wait(0.2)
            runner.stop()

        run_once.assert_called_once()
        self.assertFalse(runner._thread.is_alive())

    @override_settings(RECURRING_SCHEDULER_ENABLED=False)
    def test_disabled_does_not_start(self):
        self.assertIsNone(start_scheduler())

    @override_settings(RECURRING_SCHEDULER_ENABLED=True)
    def test_starting_warns_that_it_is_deprecated(self):
        with mock.patch.object(scheduler, "is_server_process", return_value=True):
            with mock.patch.object(RecurringScheduler, "start"):
                with self.assertLogs("apps.finance.scheduler", level="WARNING") as logs:
                    self.assertIsNotNone(start_scheduler())

        self.assertIn("obsoleto", logs.output[0])

    @override_settings(RECURRING_SCHEDULER_ENABLED=True)
    def test_only_starts_for_server_processes(self):
        with mock.patch.object(scheduler, "is_server_process", return_value=False):
            self.assertIsNone(start_scheduler())

        self.assertTrue(is_server_process(["/usr/bin/gunicorn", "config.wsgi"]))
        self.assertTrue(is_server_process(["manage.py", "runserver"]))
        self.assertFalse(is_server_process(["manage.py", "migrate"]))
