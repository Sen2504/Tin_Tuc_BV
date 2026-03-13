import re
from datetime import datetime
from app.utils.tokens import generate_reset_token, confirm_reset_token

from app.extensions import db
from app.models.user import User
from app.utils.tokens import (
    generate_confirmation_token,
    confirm_token,
)


class AuthService:
    @staticmethod
    def login(email: str, password: str):
        email = (email or "").strip().lower()

        if not email or not password:
            return None, "email and password are required"

        user = User.query.filter_by(email=email).first()
        if not user:
            return None, "invalid credentials"

        if not user.check_password(password):
            return None, "invalid credentials"

        if not user.is_active:
            return None, "account is inactive"

        if not user.confirmed:
            return None, "email not confirmed"

        return user, None

    @staticmethod
    def confirm_email(token: str):
        if not token:
            return False, "token is required"

        email = confirm_token(token)
        if not email:
            return False, "invalid or expired token"

        user = User.query.filter_by(email=email).first()
        if not user:
            return False, "user not found"

        if user.confirmed:
            return True, None

        user.confirmed = True
        user.confirmed_at = datetime.utcnow()
        db.session.commit()
        return True, None

    @staticmethod
    def resend_confirmation(email: str):
        email = (email or "").strip().lower()
        if not email:
            return None, None, "email is required"

        user = User.query.filter_by(email=email).first()
        if not user:
            return None, None, "user not found"

        if user.confirmed:
            return user, None, "already confirmed"

        token = generate_confirmation_token(user.email)
        return user, token, None
    
    @staticmethod
    def forgot_password(email: str):
        email = (email or "").strip().lower()

        if not email:
            return None, None, "email is required"

        user = User.query.filter_by(email=email).first()

        if not user:
            return None, None, "user not found"

        token = generate_reset_token(user.email)

        return user, token, None
    
    @staticmethod
    def verify_reset_token(token: str):
        if not token:
            return None

        email = confirm_reset_token(token)

        if not email:
            return None

        return email
    
    @staticmethod
    def reset_password(token: str, new_password: str, confirm_password: str):

        if not token:
            return False, "token is required"

        if not new_password or not confirm_password:
            return False, "password is required"

        if new_password != confirm_password:
            return False, "passwords do not match"

        email = confirm_reset_token(token)

        if not email:
            return False, "invalid or expired token"

        user = User.query.filter_by(email=email).first()

        if not user:
            return False, "user not found"

        user.set_password(new_password)

        db.session.commit()

        return True, None