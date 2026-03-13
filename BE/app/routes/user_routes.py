from flask import Blueprint, request, jsonify, url_for
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

    user, token, error = UserService.create_user(
        username=valid_data["username"],
        email=valid_data["email"],
        password=valid_data["password"],
        role=valid_data.get("role", "staff"),
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

    return jsonify({
        "message": "user created successfully",
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

    user, error = UserService.update_user(user_id, valid_data)
    if error:
        status = 404 if error == "user not found" else 409 if "exists" in error else 400
        return jsonify({"error": error}), status

    return jsonify({
        "message": "user updated successfully",
        "user": user_response_schema.dump(user)
    }), 200

@user_bp.route("", methods=["GET"])
@admin_required
def list_users():
    users = UserService.get_users()

    return jsonify({
        "users": user_response_schema.dump(users, many=True)
    }), 200