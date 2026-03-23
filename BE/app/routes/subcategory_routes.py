from flask import Blueprint, request, jsonify
from flask_login import login_required
from app.services.subcategory_service import SubCategoryService
from marshmallow import ValidationError
from app.schemas.subcategory_schema import (
    SubCategoryCreateSchema,
    SubCategoryUpdateSchema,
    SubCategoryResponseSchema,
)

subcategory_bp = Blueprint(
    "subcategories", __name__, url_prefix="/api/subcategories"
)

create_subcategory_schema = SubCategoryCreateSchema()
update_subcategory_schema = SubCategoryUpdateSchema()
subcategory_response_schema = SubCategoryResponseSchema()
subcategories_response_schema = SubCategoryResponseSchema(many=True)

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

    raise ValidationError("Giá trị boolean không hợp lệ")


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


# def serialize_media(media):
#     if not media:
#         return None

#     return {
#         "id": media.id,
#         "original_name": media.original_name,
#         "file_name": media.file_name,
#         "file_path": media.file_path,
#         "mime_type": media.mime_type,
#         "file_size": media.file_size,
#         "caption": media.caption,
#     }


# def serialize_subcategory(subcategory):
#     return {
#         "id": subcategory.id,
#         "name": subcategory.name,
#         "slug": subcategory.slug,
#         "description": subcategory.description,
#         "status": subcategory.status,
#         "category_id": subcategory.category_id,
#         "category_name": subcategory.category.name if subcategory.category else None,
#         "thumbnail_media_id": subcategory.thumbnail_media_id,
#         "thumbnail": serialize_media(subcategory.thumbnail_media),
#     }


# Các route của ADMIN
@subcategory_bp.route("", methods=["GET"])
@login_required
def get_subcategories():
    subcategories = SubCategoryService.get_subcategories()

    return jsonify({
        "subcategories": subcategories_response_schema.dump(subcategories)
    })


@subcategory_bp.route("/<int:subcategory_id>", methods=["GET"])
@login_required
def get_subcategory(subcategory_id):
    subcategory = SubCategoryService.get_subcategory(subcategory_id)

    if not subcategory:
        return jsonify({"error": "subcategory not found"}), 404

    return jsonify(subcategory_response_schema.dump(subcategory))


@subcategory_bp.route("", methods=["POST"])
@login_required
def create_subcategory():
    data = request.form.to_dict()
    thumbnail_file = request.files.get("thumbnail")

    try:
        validated_data = create_subcategory_schema.load(data)
    except ValidationError as err:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": err.messages
        }), 400

    subcategory, error = SubCategoryService.create_subcategory(
        name=validated_data.get("name"),
        description=validated_data.get("description"),
        status=parse_bool(validated_data.get("status")),
        category_id=parse_int(validated_data.get("category_id"), "category_id"),
        thumbnail_file=thumbnail_file
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Danh mục con đã được tạo",
        "subcategory": subcategory_response_schema.dump(subcategory)
    }), 201


@subcategory_bp.route("/<int:subcategory_id>", methods=["PUT"])
@login_required
def update_subcategory(subcategory_id):
    data = request.form.to_dict() if request.form else (request.get_json(silent=True) or {})
    thumbnail_file = request.files.get("thumbnail")

    try:
        validated_data = update_subcategory_schema.load(data)
    except ValidationError as err:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": err.messages
        }), 400

    subcategory, error = SubCategoryService.update_subcategory(
        subcategory_id=subcategory_id,
        name=validated_data.get("name"),
        description=validated_data.get("description"),
        status=parse_bool(validated_data["status"]) if "status" in validated_data else None,
        category_id=parse_int(validated_data["category_id"], "category_id") if "category_id" in validated_data else None,
        thumbnail_file=thumbnail_file,
        remove_thumbnail=parse_bool(validated_data.get("remove_thumbnail")) or False
    )

    if error:
        status_code = 404 if "not found" in error else 400
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "Danh mục con đã được cập nhật",
        "subcategory": subcategory_response_schema.dump(subcategory)
    })


@subcategory_bp.route("/<int:subcategory_id>", methods=["DELETE"])
@login_required
def delete_subcategory(subcategory_id):
    deleted, error = SubCategoryService.delete_subcategory(subcategory_id)

    if error:
        status_code = 404 if "not found" in error else 400
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "Danh mục con đã được xóa"
    }), 200