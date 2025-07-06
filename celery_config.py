broker_url= "redis://localhost:6379/0"
result_backend= "redis://localhost:6379/1"
timezone= "Asia/Kolkata"
enable_utc = False
broker_connection_retry_on_startup = True


from celery.schedules import crontab


beat_schedule = {
    'send-daily-user-reminders': {
        'task': 'application.task.daily_user_reminder',
        'schedule': crontab(hour=12, minute=32), 
    },
}