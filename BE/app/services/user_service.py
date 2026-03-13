import re
from email_validator import validate_email, EmailNotValidError

from app.extensions import db
from app.models.user import User
from app.utils.tokens import generate_confirmation_token


class UserService:
    @staticmethod
    def create_user(username, email, password, role="staff", is_active=True):
        username = (username or "").strip()
        email = (email or "").strip().lower()
        role = (role or "staff").strip().lower()

        if not username:
            return None, None, "username is required"

        if not email:
            return None, None, "email is required"

        if not password:
            return None, None, "password is required"

        if role not in [User.ROLE_ADMIN, User.ROLE_STAFF]:
            return None, None, "role must be admin or staff"

        try:
            validate_email(email)
        except EmailNotValidError as e:
            return None, None, str(e)

        if User.query.filter_by(username=username).first():
            return None, None, "username already exists"

        if User.query.filter_by(email=email).first():
            return None, None, "email already exists"

        if len(password) < 8:
            return None, None, "password must be at least 8 characters"
        if not re.search(r"[A-Za-z]", password):
            return None, None, "password must contain at least one letter"
        if not re.search(r"\d", password):
            return None, None, "password must contain at least one digit"

        user = User(
            username=username,
            email=email,
            role=role,
            is_active=bool(is_active),
            confirmed=False,
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        token = generate_confirmation_token(user.email)
        return user, token, None

    @staticmethod
    def update_user(user_id, data: dict):
        user = User.query.get(user_id)
        if not user:
            return None, "user not found"

        if "username" in data:
            username = (data.get("username") or "").strip()
            if not username:
                return None, "username cannot be empty"

            existed = User.query.filter_by(username=username).first()
            if existed and existed.id != user.id:
                return None, "username already exists"

            user.username = username

        if "email" in data:
            email = (data.get("email") or "").strip().lower()
            if not email:
                return None, "email cannot be empty"

            try:
                validate_email(email)
            except EmailNotValidError as e:
                return None, str(e)

            existed = User.query.filter_by(email=email).first()
            if existed and existed.id != user.id:
                return None, "email already exists"

            user.email = email

        if "password" in data and data.get("password"):
            password = data.get("password")
            if len(password) < 8:
                return None, "password must be at least 8 characters"
            if not re.search(r"[A-Za-z]", password):
                return None, "password must contain at least one letter"
            if not re.search(r"\d", password):
                return None, "password must contain at least one digit"

            user.set_password(password)

        if "role" in data:
            role = (data.get("role") or "").strip().lower()
            if role not in [User.ROLE_ADMIN, User.ROLE_STAFF]:
                return None, "role must be admin or staff"
            user.role = role

        if "is_active" in data:
            user.is_active = bool(data.get("is_active"))

        db.session.commit()
        return user, None
    
    @staticmethod
    def get_users():
        users = User.query.order_by(User.id.desc()).all()
        return users