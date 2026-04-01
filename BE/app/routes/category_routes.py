from flask import Blueprint, request, jsonify
from flask_login import login_required

from app.services.category_service import CategoryService
from app.models.category import Category
from marshmallow import ValidationError

from app.schemas.category_schema import (
    CategoryCreateSchema,
    CategoryUpdateSchema,
    CategorySimpleResponseSchema,
    SubcategorySimpleResponseSchema,
    SubcategoryResponseSchema,
    CategoryListSummaryResponseSchema,
    CategoryOptionSchema,
    CategoryEditResponseSchema,
)

category_bp = Blueprint("categories", __name__, url_prefix="/api/categories")

category_simple_response_schema = CategorySimpleResponseSchema()
subcategory_simple_response_schema = SubcategorySimpleResponseSchema()
subcategory_response_schema = SubcategoryResponseSchema()
category_list_summary_response_schema = CategoryListSummaryResponseSchema(many=True)
category_create_schema = CategoryCreateSchema()
category_update_schema = CategoryUpdateSchema()
category_option_schema = CategoryOptionSchema(many=True)
category_edit_response_schema = CategoryEditResponseSchema()


# ======================Các route của ADMIN
# Route để lấy chi tiết 1 category theo id, dùng cho trang admin khi click vào 
# 1 category để xem chi tiết và chỉnh sửa
@category_bp.route("/<int:category_id>", methods=["GET"])
@login_required
def get_category(category_id):
    category = CategoryService.get_category(category_id)

    if not category:
        return jsonify({"error": "category not found"}), 404

    return jsonify(category_edit_response_schema.dump(category))

# Route để lấy danh sách category dạng tóm tắt để hiển thị ra trang list
@category_bp.route("/admin/list", methods=["GET"])
@login_required
def get_category_list_summary():
    include_inactive = request.args.get("include_inactive", "").strip().lower() == "true"

    categories = CategoryService.get_category_list_summary(
        include_inactive=include_inactive
    )

    result = category_list_summary_response_schema.dump(categories)

    return jsonify({
        "categories": result
    }), 200

# Route để lấy danh sách category dạng options để hiển thị ra dropdown khi tạo/sửa category hoặc subcategory
@category_bp.route("/admin/options", methods=["GET"])
@login_required
def get_category_options():
    include_inactive = request.args.get("include_inactive", "").strip().lower() == "true"

    categories, error = CategoryService.get_category_options(
        include_inactive=include_inactive
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "categories": category_option_schema.dump(categories)
    }), 200

# Route để tạo mới 1 category
@category_bp.route("", methods=["POST"])
@login_required
def create_category():
    json_data = request.get_json() or {}

    try:
        validated_data = category_create_schema.load(json_data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    category, error = CategoryService.create_category(
        name=validated_data["name"],
        description=validated_data.get("description"),
        status=validated_data.get("status", True)
    )

    if error:
        return jsonify({"error": error}), 400

    category_summary = CategoryService.get_category_summary_by_id(category.id)

    return jsonify({
        "message": "Danh mục đã được tạo",
        "category": category_summary
    }), 201

# Route để cập nhật 1 category
@category_bp.route("/<int:category_id>", methods=["PUT"])
@login_required
def update_category(category_id):
    json_data = request.get_json() or {}

    try:
        validated_data = category_update_schema.load(json_data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    updated_category, error = CategoryService.update_category(
        category_id,
        name=validated_data.get("name"),
        description=validated_data.get("description"),
        status=validated_data.get("status")
    )

    if error:
        return jsonify({"error": error}), 400

    category_summary = CategoryService.get_category_summary_by_id(category_id)

    return jsonify({
        "message": "Danh mục đã được cập nhật",
        "category": category_summary
    }), 200

# Route để xóa 1 category
@category_bp.route("/<int:category_id>", methods=["DELETE"])
@login_required
def delete_category(category_id):
    deleted, error = CategoryService.delete_category(category_id)

    if error:
        status_code = 404 if "not found" in error else 400
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "Danh mục đã được xóa"
    }), 200

# ======================Các route PUBLIC ra giao diện
# Route để lấy chi tiết 1 category theo slug, dùng cho trang categoryPage 
# khi người dùng click vào 1 category để xem chi tiết và các subcategory của nó
@category_bp.route("/<string:slug>/subcategories", methods=["GET"])
def get_category_subcategories_by_slug(slug):
    category = CategoryService.get_category_by_slug(slug)

    if not category:
        return jsonify({"error": "category not found"}), 404

    active_subcategories = [s for s in category.subcategories if s.status]

    return jsonify({
        "category": category_simple_response_schema.dump(category),
        "subcategories": subcategory_response_schema.dump(active_subcategories, many=True)
    })

# Route để lấy danh sách tất cả category ra trag UI client
@category_bp.route("", methods=["GET"])
@login_required
def get_categories():
    include_inactive = request.args.get("include_inactive", "false").lower() in {"1", "true", "yes"}

    categories = Category.query.order_by(Category.id).all()

    result = []
    for c in categories:
        if not include_inactive and not c.status:
            continue

        category_data = category_simple_response_schema.dump(c)
        visible_subcategories = [
            subcategory_simple_response_schema.dump(s)
            for s in c.subcategories
            if include_inactive or s.status
        ]
        category_data["subcategories"] = visible_subcategories
        category_data["subcategories_count"] = len(visible_subcategories)

        posts_count = 0
        for subcategory in c.subcategories:
            if not include_inactive and not subcategory.status:
                continue

            if include_inactive:
                posts_count += len(subcategory.posts)
            else:
                posts_count += sum(1 for post in subcategory.posts if post.status)

        category_data["posts_count"] = posts_count
        result.append(category_data)

    return jsonify({"categories": result})