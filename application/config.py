class Config():
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = True

class LocalDevelopmentConfig(Config):

    SQLALCHEMY_DATABASE_URI = "sqlite:///parking.sqlite3"
    DEBUG = True

    SECRET_KEY = "PAMDU"
    SECURITY_PASSWORD_HASH = "bcrypt" 
    SECURITY_PASSWORD_SALT = "this-is-a-password-salt" 
    WTF_CSRF_ENABLED = False
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token"
    SQLALCHEMY_TRACK_MODIFICATIONS = False