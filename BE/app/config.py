import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # token config
    SECURITY_CONFIRM_SALT = os.getenv("SECURITY_CONFIRM_SALT", "confirm-salt")
    SECURITY_RESET_SALT = os.getenv("SECURITY_RESET_SALT", "reset-salt")
    CONFIRM_TOKEN_EXPIRE = int(os.getenv("CONFIRM_TOKEN_EXPIRE", 300))
    RESET_TOKEN_EXPIRE = int(os.getenv("RESET_TOKEN_EXPIRE", 300))

    # frontend url
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # mail config
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True") == "True"
    MAIL_USE_SSL = os.getenv("MAIL_USE_SSL", "False") == "True"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", MAIL_USERNAME)

    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB