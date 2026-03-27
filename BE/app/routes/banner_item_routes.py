from flask import Blueprint, jsonify, request
from flask_login import login_required
from marshmallow import ValidationError

from app.schemas.banner_item_schema import (
    BannerItemCreateSchema,
    BannerItemUpdateSchema,
)
from app.schemas.banner_schema import BannerItemResponseSchema
from app.services.banner_item_service import BannerItemService


banner_item_bp = Blueprint("banner_items", __name__, url_prefix="/api/banner-items")

banner_item_create_schema = BannerItemCreateSchema()
banner_item_update_schema = BannerItemUpdateSchema()

banner_item_response_schema = BannerItemResponseSchema()
banner_items_response_schema = BannerItemResponseSchema(many=True)


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


def parse_int(value, field_name="id"):
    if value is None or value == "":
        return None

    if isinstance(value, int):
        return value

    if isinstance(value, str):
        value = value.strip()
        if value.isdigit():
            return int(value)

    raise ValidationError(f"{field_name} phải là số nguyên")


# 1. ADMIN
@banner_item_bp.route("", methods=["GET"])
@login_required
def get_banner_items():
    items, error = BannerItemService.get_banner_items()

    if error:
        return jsonify({"error": error}), 400

    return jsonify(banner_items_response_schema.dump(items)), 200


@banner_item_bp.route("/<int:item_id>", methods=["GET"])
@login_required
def get_banner_item_by_id(item_id):
    item, error = BannerItemService.get_banner_item_by_id(item_id)

    if error:
        return jsonify({"error": error}), 404

    return jsonify(banner_item_response_schema.dump(item)), 200


@banner_item_bp.route("", methods=["POST"])
@login_required
def create_banner_item():
    data = request.form.to_dict() if request.form else (request.get_json(silent=True) or {})
    image_file = request.files.get("image")

    try:
        validated_data = banner_item_create_schema.load(data)
    except ValidationError as err:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": err.messages
        }), 400

    item, error = BannerItemService.create_banner_item(
        banner_id=parse_int(validated_data.get("banner_id"), "banner_id"),
        url=validated_data.get("url"),
        sort_order=parse_int(validated_data.get("sort_order", 0), "sort_order"),
        status=parse_bool(validated_data.get("status", True)),
        image_file=image_file,
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Tạo banner item thành công",
        "banner_item": banner_item_response_schema.dump(item)
    }), 201


@banner_item_bp.route("/<int:item_id>", methods=["PUT"])
@login_required
def update_banner_item(item_id):
    data = request.form.to_dict() if request.form else (request.get_json(silent=True) or {})
    image_file = request.files.get("image")

    try:
        validated_data = banner_item_update_schema.load(data)
    except ValidationError as err:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": err.messages
        }), 400

    item, error = BannerItemService.update_banner_item(
        item_id=item_id,
        banner_id=parse_int(validated_data["banner_id"], "banner_id") if "banner_id" in validated_data else None,
        url=validated_data.get("url"),
        sort_order=parse_int(validated_data["sort_order"], "sort_order") if "sort_order" in validated_data else None,
        status=parse_bool(validated_data["status"]) if "status" in validated_data else None,
        image_file=image_file,
        remove_image=parse_bool(validated_data["remove_image"]) if "remove_image" in validated_data else False,
    )

    if error:
        status_code = 404 if "not found" in error.lower() else 400
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "Banner item đã được cập nhật",
        "banner_item": banner_item_response_schema.dump(item)
    }), 200


@banner_item_bp.route("/<int:item_id>", methods=["DELETE"])
@login_required
def delete_banner_item(item_id):
    deleted, error = BannerItemService.delete_banner_item(item_id)

    if error:
        status_code = 404 if "not found" in error.lower() else 400
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "Xóa banner item thành công"
    }), 200