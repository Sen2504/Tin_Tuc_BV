from flask import Blueprint, request, jsonify
from flask_login import login_required
from app.services.subcategory_service import SubCategoryService
from marshmallow import ValidationError
from app.schemas.subcategory_schema import (
    SubCategoryCreateSchema,
    SubCategoryUpdateSchema,
    # ======================= Mới thêm để trả về dữ liệu tổng hợp cho trang quản trị ========================
    SubCategoryListItemSchema,
    SubCategoryStatusResponseSchema,
    SubCategoryCreateResponseSchema,
    SubCategoryUpdateResponseSchema,
    SubCategoryOptionSchema,
    SubCategoryEditResponseSchema,
)

subcategory_bp = Blueprint(
    "subcategories", __name__, url_prefix="/api/subcategories"
)

create_subcategory_schema = SubCategoryCreateSchema()
update_subcategory_schema = SubCategoryUpdateSchema()
# ======================= Mới thêm để trả về dữ liệu tổng hợp cho trang quản trị ========================
subcategory_list_item_schema = SubCategoryListItemSchema(many=True)
subcategory_status_response_schema = SubCategoryStatusResponseSchema()
subcategory_create_response_schema = SubCategoryCreateResponseSchema()
subcategory_update_response_schema = SubCategoryUpdateResponseSchema()
subcategory_option_schema = SubCategoryOptionSchema(many=True)
subcategory_edit_response_schema = SubCategoryEditResponseSchema()

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

# Route để lấy chi tiết 1 subcategory theo id, dùng cho trang admin khi click vào 
# 1 subcategory để xem chi tiết và chỉnh sửa
@subcategory_bp.route("/<int:subcategory_id>", methods=["GET"])
@login_required
def get_subcategory(subcategory_id):
    subcategory = SubCategoryService.get_subcategory(subcategory_id)

    if not subcategory:
        return jsonify({"error": "subcategory not found"}), 404

    return jsonify(subcategory_edit_response_schema.dump(subcategory))

# Route để tạo mới 1 subcategory ở trang admin
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
        "subcategory": subcategory_create_response_schema.dump(subcategory)
    }), 201

# Route để cập nhật 1 subcategory ở trang admin
# có thể cập nhật cả thumbnail và các trường thông tin khác
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
        "subcategory": subcategory_update_response_schema.dump(subcategory)
    })

# Route để xóa 1 subcategory ở trang admin
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

# ======================= Mới thêm để trả về dữ liệu tổng hợp cho trang quản trị ========================
# Route để lấy danh sách subcategory kèm thông tin category cha
# dùng cho trang admin ở phần quản lý subcategory
@subcategory_bp.route("/admin/list", methods=["GET"])
@login_required
def get_subcategory_list_summary():
    include_inactive = request.args.get("include_inactive", "false").lower() == "true"
    subcategory_summaries = SubCategoryService.get_subcategory_list_summary(include_inactive=include_inactive)

    return jsonify({
        "subcategories": subcategory_list_item_schema.dump(subcategory_summaries)
    })

# Route để cập nhật trạng thái của subcategory ở trang list
@subcategory_bp.route("/<int:subcategory_id>/status", methods=["PUT"])
@login_required
def update_subcategory_status(subcategory_id):
    data = request.get_json(silent=True) or {}

    status_value = data.get("status")

    try:
        parsed_status = parse_bool(status_value)
    except ValidationError as err:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": {
                "status": [str(err)]
            }
        }), 400

    if parsed_status is None:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": {
                "status": ["status là bắt buộc"]
            }
        }), 400

    subcategory, error = SubCategoryService.update_subcategory_status(
        subcategory_id=subcategory_id,
        status=parsed_status
    )

    if error:
        status_code = 404 if "không tìm thấy" in error.lower() else 400
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "Danh mục con đã được cập nhật trạng thái",
        "subcategory": subcategory_status_response_schema.dump(subcategory)
    })

# Route để lấy options subcategory theo category_id
# dùng cho dropdown khi tạo/sửa bài viết
@subcategory_bp.route("/admin/options", methods=["GET"])
@login_required
def get_subcategory_options():
    raw_category_id = request.args.get("category_id")
    include_inactive = request.args.get("include_inactive", "").strip().lower() == "true"

    try:
        category_id = parse_int(raw_category_id, "category_id")
    except ValidationError as err:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": {
                "category_id": [str(err)]
            }
        }), 400

    subcategories, error = SubCategoryService.get_subcategory_options(
        category_id=category_id,
        include_inactive=include_inactive
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "subcategories": subcategory_option_schema.dump(subcategories)
    }), 200