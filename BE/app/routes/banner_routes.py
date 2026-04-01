import json

from flask import Blueprint, jsonify, request
from flask_login import login_required
from marshmallow import ValidationError

from app.schemas.banner_schema import (
    BannerCreateSchema,
    BannerUpdateSchema,
    BannerResponseSchema,
    BannerListResponseSchema,
    BannerFullCreateSchema,
    BannerUpdateResponseSchema
)
from app.services.banner_service import BannerService


banner_bp = Blueprint("banners", __name__, url_prefix="/api/banners")

banner_create_schema = BannerCreateSchema()
banner_update_schema = BannerUpdateSchema()
banner_full_create_schema = BannerFullCreateSchema()

banner_response_schema = BannerResponseSchema()
banners_list_response_schema = BannerListResponseSchema(many=True)
banner_update_response_schema = BannerUpdateResponseSchema()


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

    return jsonify(banners_list_response_schema.dump(banners)), 200


@banner_bp.route("/<int:banner_id>", methods=["GET"])
@login_required
def get_banner_by_id(banner_id):
    banner, error = BannerService.get_banner_by_id(banner_id)

    if error:
        return jsonify({"error": error}), 404

    return jsonify(banner_update_response_schema.dump(banner)), 200


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
        "banner": {
            "id": banner.id,
            "status": banner.status,
        }
    }), 201


@banner_bp.route("/full", methods=["POST"])
@login_required
def create_banner_full():
    raw_status = request.form.get("status", True)
    raw_items = request.form.get("items")

    if raw_items is None:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": {
                "items": ["items là bắt buộc"]
            }
        }), 400

    try:
        parsed_items = json.loads(raw_items)
    except json.JSONDecodeError:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": {
                "items": ["items phải là JSON hợp lệ"]
            }
        }), 400

    payload = {
        "status": raw_status,
        "items": parsed_items,
    }

    try:
        validated_data = banner_full_create_schema.load(payload)
    except ValidationError as err:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": err.messages
        }), 400

    files_map = request.files.to_dict()

    for item in validated_data["items"]:
        image_key = item["image_key"]
        if image_key not in files_map:
            return jsonify({
                "message": "Dữ liệu không hợp lệ",
                "errors": {
                    image_key: [f"Thiếu file ảnh cho {image_key}"]
                }
            }), 400

    result, error = BannerService.create_banner_full(
        status=parse_bool(validated_data.get("status", True)),
        items_data=[
            {
                "image_key": item["image_key"],
                "url": item.get("url"),
                "sort_order": int(item.get("sort_order", 0)),
                "status": parse_bool(item.get("status", True)),
            }
            for item in validated_data["items"]
        ],
        files_map=files_map,
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Tạo banner và banner items thành công",
        "banner": result
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
        "banner": {
            "id": banner.id,
            "status": banner.status
        }
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