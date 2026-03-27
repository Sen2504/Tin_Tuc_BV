from flask import Blueprint, jsonify, request
from flask_login import login_required
from marshmallow import ValidationError

from app.schemas.banner_schema import (
    BannerCreateSchema,
    BannerUpdateSchema,
    BannerResponseSchema,
)
from app.services.banner_service import BannerService


banner_bp = Blueprint("banners", __name__, url_prefix="/api/banners")

banner_create_schema = BannerCreateSchema()
banner_update_schema = BannerUpdateSchema()

banner_response_schema = BannerResponseSchema()
banners_response_schema = BannerResponseSchema(many=True)


def parse_bool(value):
    if value is None or value == "":
        return None

    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        value = value.strip().lower()
        if value in {"true", "1", "yes", "on", "active"}:
            return True
        if value in {"false", "0", "no", "off", "inactive"}:
            return False

    if isinstance(value, int):
        return bool(value)

    raise ValidationError("status phải là boolean hợp lệ")


# 1. ADMIN
@banner_bp.route("", methods=["GET"])
@login_required
def get_banners():
    banners, error = BannerService.get_banners()

    if error:
        return jsonify({"error": error}), 400

    return jsonify(banners_response_schema.dump(banners)), 200


@banner_bp.route("/<int:banner_id>", methods=["GET"])
@login_required
def get_banner_by_id(banner_id):
    banner, error = BannerService.get_banner_by_id(banner_id)

    if error:
        return jsonify({"error": error}), 404

    return jsonify(banner_response_schema.dump(banner)), 200


@banner_bp.route("", methods=["POST"])
@login_required
def create_banner():
    data = request.get_json(silent=True) or {}

    try:
        validated_data = banner_create_schema.load(data)
    except ValidationError as err:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": err.messages
        }), 400

    banner, error = BannerService.create_banner(
        status=parse_bool(validated_data.get("status", True)),
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Tạo banner thành công",
        "banner": banner_response_schema.dump(banner)
    }), 201


@banner_bp.route("/<int:banner_id>", methods=["PUT"])
@login_required
def update_banner(banner_id):
    data = request.get_json(silent=True) or {}

    try:
        validated_data = banner_update_schema.load(data)
    except ValidationError as err:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": err.messages
        }), 400

    banner, error = BannerService.update_banner(
        banner_id=banner_id,
        status=parse_bool(validated_data["status"]) if "status" in validated_data else None,
    )

    if error:
        status_code = 404 if "not found" in error.lower() else 400
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "Banner đã được cập nhật",
        "banner": banner_response_schema.dump(banner)
    }), 200


@banner_bp.route("/<int:banner_id>", methods=["DELETE"])
@login_required
def delete_banner(banner_id):
    deleted, error = BannerService.delete_banner(banner_id)

    if error:
        status_code = 404 if "not found" in error.lower() else 400
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "Xóa banner thành công"
    }), 200


# 2. PUBLIC
@banner_bp.route("/public", methods=["GET"])
def get_active_banners_public():
    banners, error = BannerService.get_active_banner_public()

    if error:
        return jsonify({"error": error}), 400

    return jsonify({"banners": banners}), 200