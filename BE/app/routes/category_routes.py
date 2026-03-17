from flask import Blueprint, request, jsonify

from app.services.category_service import CategoryService
from app.models.category import Category

category_bp = Blueprint("categories", __name__, url_prefix="/api/categories")


def serialize_category(category, include_subcategories=False):
    data = {
        "id": category.id,
        "name": category.name,
        "slug": category.slug,
        "description": category.description,
        "status": category.status,
    }

    if include_subcategories:
        data["subcategories"] = [
            {
                "id": s.id,
                "name": s.name,
                "slug": s.slug,
                "description": s.description,
                "status": s.status,
                "thumbnail_media_id": s.thumbnail_media_id,
                "thumbnail": {
                    "id": s.thumbnail_media.id,
                    "file_path": s.thumbnail_media.file_path,
                    "file_name": s.thumbnail_media.file_name,
                    "original_name": s.thumbnail_media.original_name,
                } if s.thumbnail_media else None
            }
            for s in category.subcategories
        ]

    return data


@category_bp.route("", methods=["POST"])
def create_category():
    data = request.get_json(silent=True) or {}

    name = data.get("name")
    description = data.get("description")
    status = data.get("status", True)

    if not name:
        return jsonify({"error": "name is required"}), 400

    category, error = CategoryService.create_category(
        name=name,
        description=description,
        status=status
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "category created",
        "category": serialize_category(category)
    }), 201


@category_bp.route("/<int:category_id>", methods=["PUT"])
def update_category(category_id):
    data = request.get_json(silent=True) or {}

    category, error = CategoryService.update_category(
        category_id=category_id,
        name=data.get("name"),
        description=data.get("description"),
        status=data.get("status")
    )

    if error:
        status_code = 404 if "not found" in error else 400
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "category updated",
        "category": serialize_category(category)
    })


@category_bp.route("", methods=["GET"])
def get_categories():
    include_inactive = request.args.get("include_inactive", "false").lower() in {"1", "true", "yes"}

    categories = Category.query.order_by(Category.id).all()

    return jsonify({
        "categories": [
            {
                "id": c.id,
                "name": c.name,
                "slug": c.slug,
                "description": c.description,
                "status": c.status,
                "subcategories": [
                    {
                        "id": s.id,
                        "name": s.name,
                        "slug": s.slug
                    }
                    for s in c.subcategories if include_inactive or s.status
                ]
            }
            for c in categories if include_inactive or c.status
        ]
    })


@category_bp.route("/<int:category_id>", methods=["GET"])
def get_category(category_id):
    category = CategoryService.get_category(category_id)

    if not category:
        return jsonify({"error": "category not found"}), 404

    return jsonify(serialize_category(category))


@category_bp.route("/<string:slug>/subcategories", methods=["GET"])
def get_category_subcategories_by_slug(slug):
    category = CategoryService.get_category_by_slug(slug)

    if not category:
        return jsonify({"error": "category not found"}), 404

    active_subcategories = [s for s in category.subcategories if s.status]

    return jsonify({
        "category": {
            "id": category.id,
            "name": category.name,
            "slug": category.slug,
            "description": category.description,
            "status": category.status,
        },
        "subcategories": [
            {
                "id": s.id,
                "name": s.name,
                "slug": s.slug,
                "description": s.description,
                "status": s.status,
                "thumbnail_media_id": s.thumbnail_media_id,
                "thumbnail": {
                    "id": s.thumbnail_media.id,
                    "file_path": s.thumbnail_media.file_path,
                    "file_name": s.thumbnail_media.file_name,
                    "original_name": s.thumbnail_media.original_name,
                } if s.thumbnail_media else None
            }
            for s in active_subcategories
        ]
    })