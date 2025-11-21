"""
Celery configuration for SNERTP Laboratory Management System.
"""

import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('snertp_lab')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Configure periodic tasks
app.conf.beat_schedule = {
    'check-delayed-samples-every-hour': {
        'task': 'scheduler.tasks.check_delayed_samples',
        'schedule': crontab(minute=0),  # Every hour
    },
    'optimize-schedule-daily': {
        'task': 'scheduler.tasks.optimize_daily_schedule',
        'schedule': crontab(hour=6, minute=0),  # Every day at 6 AM
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
