from flask import Blueprint, request, jsonify, url_for, session
from flask_login import login_user, logout_user, login_required, current_user

from app.services.auth_service import AuthService
from app.utils.email import send_email

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email")
    password = data.get("password")
    remember = bool(data.get("remember", True))

    user, error = AuthService.login(email, password)
    if error:
        status = 403 if error in ["account is inactive", "email not confirmed"] else 401 if error == "invalid credentials" else 400
        return jsonify({"error": error}), status

    login_user(user, remember=remember)

    return jsonify({
        "message": "logged in",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "confirmed": user.confirmed
        }
    }), 200


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    session.clear()
    logout_user()
    return jsonify({"message": "logged out"}), 200


@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    u = current_user
    return jsonify({
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "role": u.role,
        "is_active": u.is_active,
        "confirmed": u.confirmed
    }), 200


@auth_bp.route("/confirm", methods=["GET"])
def confirm_email():
    token = request.args.get("token")
    success, error = AuthService.confirm_email(token)

    if not success:
        return jsonify({"error": error}), 400

    return jsonify({"message": "email confirmed successfully"}), 200


@auth_bp.route("/resend-confirm", methods=["POST"])
def resend_confirm():
    data = request.get_json(silent=True) or {}
    email = data.get("email")

    user, token, error = AuthService.resend_confirmation(email)
    if error:
        status = 404 if error == "user not found" else 400
        return jsonify({"error": error}), status

    confirm_url = url_for("auth.confirm_email", token=token, _external=True)

    html = f"""
    <p>Xin chào {user.username},</p>
    <p>Đây là liên kết xác nhận email mới của bạn:</p>
    <p><a href="{confirm_url}">{confirm_url}</a></p>
    <p>Liên kết hết hạn sau 5 phút.</p>
    """

    send_email("Xác nhận email", [user.email], html)
    return jsonify({"message": "confirmation email resent"}), 200

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = data.get("email")

    user, token, error = AuthService.forgot_password(email)

    if error:
        status = 404 if error == "user not found" else 400
        return jsonify({"error": error}), status

    reset_url = f"http://localhost:5173/reset-password?token={token}"

    html = f"""
    <p>Xin chào {user.username},</p>
    <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
    <p>Nhấn vào liên kết bên dưới để đặt lại mật khẩu:</p>
    <p><a href="{reset_url}">{reset_url}</a></p>
    <p>Liên kết sẽ hết hạn sau 10 phút.</p>
    """

    send_email("Reset password", [user.email], html)

    return jsonify({"message": "reset password email sent"}), 200

@auth_bp.route("/reset-password", methods=["GET"])
def reset_password_page():
    token = request.args.get("token")

    email = AuthService.verify_reset_token(token)

    if not email:
        return jsonify({"error": "invalid or expired token"}), 400

    return jsonify({
        "message": "token valid",
        "token": token
    }), 200

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}

    token = data.get("token")
    new_password = data.get("new_password")
    confirm_password = data.get("confirm_password")

    success, error = AuthService.reset_password(
        token,
        new_password,
        confirm_password
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({"message": "password reset successful"}), 200