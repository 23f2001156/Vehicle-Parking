broker_url= "redis://localhost:6379/0"
result_backend= "redis://localhost:6379/1"
timezone= "Asia/Kolkata"
enable_utc = False
broker_connection_retry_on_startup = True


from celery.schedules import crontab
from application.task import daily_user_reminder

'''beat_schedule = {
    'send-daily-user-reminders': {
        'task': daily_user_reminder,
        'schedule': crontab(hour=18, minute=30), 
    },
}'''