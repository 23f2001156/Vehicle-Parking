from flask import Flask
from flask_cors import CORS
from application.database import db
from application.models import User, Role
from application.config import LocalDevelopmentConfig
from flask_security import Security, SQLAlchemyUserDatastore
from flask_security.utils import hash_password

def create_app():
    app = Flask(__name__)
    app.config.from_object(LocalDevelopmentConfig)
    db.init_app(app)

    # Enable CORS for all origins (you can restrict origins if needed)
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8080", "http://127.0.0.1:8080"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "Authentication-Token"]
        }
    })

    # Setup Flask-Security datastore and Security extension
    datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, datastore, register_blueprint=False)

    app.app_context().push()
    return app

app = create_app()

with app.app_context():
    db.create_all()
    app.security.datastore.find_or_create_role(name="admin", description="Superuser of app")
    app.security.datastore.find_or_create_role(name="user", description="General user of app")
    db.session.commit()

    # Create admin user if not exists
    if not app.security.datastore.find_user(email="user0@admin.com"):
        app.security.datastore.create_user(
            email="user0@admin.com",
            username="admin01",
            password=hash_password("1234"),
            roles=['admin']
        )

    # Create regular user if not exists
    if not app.security.datastore.find_user(email="user1@user.com"):
        app.security.datastore.create_user(
            email="user1@user.com",
            username="user01",
            password=hash_password("1234"),
            roles=['user']
        )
    db.session.commit()

from application.routes import *

if __name__ == "__main__":
    # Run in debug mode for easier development
    app.run(debug=True)
