import re
from email_validator import validate_email, EmailNotValidError
from sqlalchemy import func

from app.extensions import db
from app.models.user import User
from app.utils.tokens import generate_confirmation_token


class UserService:
    @staticmethod
    def _is_admin_role(value):
        return (value or "").strip().lower() == User.ROLE_ADMIN

    @staticmethod
    def _find_other_admin(exclude_user_id=None):
        query = User.query.filter(func.lower(User.role) == User.ROLE_ADMIN)

        if exclude_user_id is not None:
            query = query.filter(User.id != exclude_user_id)

        return query.first()

    @staticmethod
    def has_admin_account():
        return UserService._find_other_admin() is not None

    @staticmethod
    def create_user(username, email, password, role="staff", is_active=True):
        username = (username or "").strip()
        email = (email or "").strip().lower()
        role = (role or "staff").strip().lower()

        if not username:
            return None, None, "username is required"

        if len(username) > 255:
            return None, None, "username must not exceed 255 characters"

        if not email:
            return None, None, "email is required"

        if not password:
            return None, None, "password is required"

        if role not in [User.ROLE_ADMIN, User.ROLE_STAFF]:
            return None, None, "role must be admin or staff"

        if role == User.ROLE_ADMIN and UserService._find_other_admin():
            return None, None, "admin account already exists in the system"

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
    def update_user(user_id, data: dict, actor=None):
        user = User.query.get(user_id)
        if not user:
            return None, "user not found"

        if actor and (not actor.is_admin()) and actor.id != user.id:
            return None, "permission denied"

        if "username" in data:
            username = (data.get("username") or "").strip()

            if not username:
                return None, "username cannot be empty"

            if len(username) > 255:
                return None, "username must not exceed 255 characters"

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

            if actor and (not actor.is_admin()) and role != user.role:
                return None, "permission denied"

            if role == User.ROLE_ADMIN and UserService._find_other_admin(exclude_user_id=user.id):
                return None, "admin account already exists in the system"

            if UserService._is_admin_role(user.role) and role != User.ROLE_ADMIN:
                return None, "admin role cannot be changed"

            user.role = role

        if "is_active" in data:
            next_active = bool(data.get("is_active"))

            if UserService._is_admin_role(user.role) and not next_active:
                return None, "admin account cannot be set to inactive"

            if (not user.is_active) and next_active:
                return None, "inactive user cannot be reactivated"

            user.is_active = next_active

        db.session.commit()
        return user, None
    
    @staticmethod
    def get_users():
        users = User.query.order_by(User.id.desc()).all()
        return users