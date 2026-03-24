from flask import Blueprint, request, jsonify, url_for
from flask_login import current_user, login_required
from marshmallow import ValidationError

from app.services.user_service import UserService
from app.schemas.user_schema import (
    UserCreateSchema,
    UserUpdateSchema,
    UserResponseSchema
)
from app.utils.permissions import admin_required
from app.utils.email import send_email

user_bp = Blueprint("users", __name__, url_prefix="/api/users")

create_user_schema = UserCreateSchema()
update_user_schema = UserUpdateSchema()
user_response_schema = UserResponseSchema()


@user_bp.route("", methods=["POST"])
@admin_required
def create_user():
    data = request.get_json(silent=True) or {}

    try:
        valid_data = create_user_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    requested_role = (valid_data.get("role") or "staff").strip().lower()
    has_admin = UserService.has_admin_account()
    final_role = "staff" if has_admin else requested_role

    user, token, error = UserService.create_user(
        username=valid_data["username"],
        email=valid_data["email"],
        password=valid_data["password"],
        role=final_role,
        is_active=valid_data.get("is_active", True),
    )

    if error:
        status = 409 if "exists" in error else 400
        return jsonify({"error": error}), status

    confirm_url = url_for("auth.confirm_email", token=token, _external=True)

    html = f"""
    <p>Xin chào {user.username},</p>
    <p>Tài khoản của bạn đã được tạo trên hệ thống.</p>
    <p>Nhấn vào liên kết sau để xác nhận email:</p>
    <p><a href="{confirm_url}">{confirm_url}</a></p>
    <p>Liên kết hết hạn sau 5 phút.</p>
    """

    send_email("Xác nhận tài khoản", [user.email], html)

    message = "user created successfully"
    if has_admin and requested_role == "admin":
        message = "admin account already exists, new user was created with staff role"

    return jsonify({
        "message": message,
        "user": user_response_schema.dump(user)
    }), 201


@user_bp.route("/<int:user_id>", methods=["PUT"])
@admin_required
def update_user(user_id):
    data = request.get_json(silent=True) or {}

    try:
        valid_data = update_user_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    user, error = UserService.update_user(user_id, valid_data, actor=current_user)
    if error:
        status = (
            404 if error == "user not found"
            else 403 if error == "permission denied"
            else 409 if "exists" in error
            else 400
        )
        return jsonify({"error": error}), status

    return jsonify({
        "message": "user updated successfully",
        "user": user_response_schema.dump(user)
    }), 200


@user_bp.route("/me", methods=["PUT"])
@login_required
def update_my_profile():
    data = request.get_json(silent=True) or {}

    try:
        valid_data = update_user_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    allowed_fields = {"username", "email", "password"}
    profile_data = {
        key: value
        for key, value in valid_data.items()
        if key in allowed_fields
    }

    user, error = UserService.update_user(current_user.id, profile_data, actor=current_user)
    if error:
        status = (
            404 if error == "user not found"
            else 403 if error == "permission denied"
            else 409 if "exists" in error
            else 400
        )
        return jsonify({"error": error}), status

    return jsonify({
        "message": "profile updated successfully",
        "user": user_response_schema.dump(user)
    }), 200

@user_bp.route("", methods=["GET"])
@admin_required
def list_users():
    users = UserService.get_users()

    return jsonify({
        "users": user_response_schema.dump(users, many=True),
        "current_user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role,
            "is_active": current_user.is_active,
        },
    }), 200