from flask import Blueprint, request, jsonify
from flask_login import login_required

from app.services.category_service import CategoryService
from app.models.category import Category
from marshmallow import ValidationError

from app.schemas.category_schema import (
    CategoryCreateSchema,
    CategoryUpdateSchema,
    CategoryResponseSchema,
    CategorySimpleResponseSchema,
    SubcategorySimpleResponseSchema,
    SubcategoryResponseSchema,
)

category_bp = Blueprint("categories", __name__, url_prefix="/api/categories")


create_category_schema = CategoryCreateSchema()
update_category_schema = CategoryUpdateSchema()

category_response_schema = CategoryResponseSchema()
category_simple_response_schema = CategorySimpleResponseSchema()
subcategory_simple_response_schema = SubcategorySimpleResponseSchema()
subcategory_response_schema = SubcategoryResponseSchema()


def parse_bool(value):
    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        value = value.strip().lower()
        if value in {"true", "1", "yes", "on"}:
            return True
        if value in {"false", "0", "no", "off"}:
            return False

    if isinstance(value, int):
        return bool(value)

    return value

# Các route của ADMIN
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


@category_bp.route("/<int:category_id>", methods=["GET"])
@login_required
def get_category(category_id):
    category = CategoryService.get_category(category_id)

    if not category:
        return jsonify({"error": "category not found"}), 404

    return jsonify(category_response_schema.dump(category))


@category_bp.route("", methods=["POST"])
@login_required
def create_category():
    data = request.get_json(silent=True) or {}

    try:
        validated_data = create_category_schema.load(data)
    except ValidationError as err:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": err.messages
        }), 400

    category, error = CategoryService.create_category(
        name=validated_data.get("name"),
        description=validated_data.get("description"),
        status=parse_bool(validated_data.get("status", True))
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Danh mục đã được tạo",
        "category": category_response_schema.dump(category)
    }), 201


@category_bp.route("/<int:category_id>", methods=["PUT"])
@login_required
def update_category(category_id):
    data = request.get_json(silent=True) or {}

    try:
        validated_data = update_category_schema.load(data)
    except ValidationError as err:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": err.messages
        }), 400

    category, error = CategoryService.update_category(
        category_id=category_id,
        name=validated_data.get("name"),
        description=validated_data.get("description"),
        status=parse_bool(validated_data["status"]) if "status" in validated_data else None
    )

    if error:
        status_code = 404 if "not found" in error else 400
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "Danh mục đã được cập nhật",
        "category": category_response_schema.dump(category)
    })

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

# Các route PUBLIC ra giao diện
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