from django.utils import timezone


def current_month_start():
    return timezone.localdate().replace(day=1)
