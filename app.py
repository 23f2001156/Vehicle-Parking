from flask import Flask
from flask_cors import CORS
from application.database import db
from application.models import User, Role
from application.config import LocalDevelopmentConfig
from flask_security import Security, SQLAlchemyUserDatastore
from flask_security.utils import hash_password
from application.celery_init import celery_init_app
from celery.schedules import crontab
from application.task import monthly_report
from flask_cache import init_cache

def create_app():
    app = Flask(__name__)
    app.config.from_object(LocalDevelopmentConfig)
    db.init_app(app)

    
    CORS(app)

    
    datastore = SQLAlchemyUserDatastore(db, User, Role)

    app.security = Security(app, datastore)

    app.app_context().push()
    return app

app = create_app()
celery=celery_init_app(app)
celery.autodiscover_tasks()


with app.app_context():
    db.create_all()
    app.security.datastore.find_or_create_role(name="admin", description="Superuser of app")
    app.security.datastore.find_or_create_role(name="user", description="General user of app")
    db.session.commit()

   
    if not app.security.datastore.find_user(email="user0@admin.com"):
        app.security.datastore.create_user(
            email="user0@admin.com",
            username="admin01",
            password=hash_password("1234"),
            roles=['admin']
        )

    
    if not app.security.datastore.find_user(email="user1@user.com"):
        app.security.datastore.create_user(
            email="user1@user.com",
            username="user01",
            password=hash_password("1234"),
            roles=['user']
        )
    db.session.commit()

from application.routes import *

@celery.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        crontab(minute = '*/2'),  
        monthly_report.s(),
    )


if __name__ == "__main__":
    app.run(debug=True)
    
cache = init_cache(app)