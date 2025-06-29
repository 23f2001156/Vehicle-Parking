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
    
    # Additional Flask-Security configurations
    SECURITY_URL_PREFIX = '/auth'
    SECURITY_LOGIN_URL = '/login'
    SECURITY_LOGOUT_URL = '/logout'
    SECURITY_REGISTER_URL = '/register'
    SECURITY_UNAUTHORIZED_VIEW = None  # Disable automatic redirects
    SECURITY_LOGIN_WITHOUT_CONFIRMATION = True
    SECURITY_REGISTERABLE = True
    SECURITY_SEND_REGISTER_EMAIL = False