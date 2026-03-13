from functools import wraps
from flask import jsonify
from flask_login import current_user, login_required
from app.models.user import User


def admin_required(func):
    @wraps(func)
    @login_required
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"error": "authentication required"}), 401

        if not current_user.is_active:
            return jsonify({"error": "account is inactive"}), 403

        if current_user.role != User.ROLE_ADMIN:
            return jsonify({"error": "admin permission required"}), 403

        return func(*args, **kwargs)
    return wrapper