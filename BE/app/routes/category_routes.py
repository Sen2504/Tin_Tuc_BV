from flask import Blueprint, request, jsonify

from app.services.category_service import CategoryService
from app.models.category import Category

category_bp = Blueprint("categories", __name__, url_prefix="/api/categories")


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
        "category": {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "status": category.status
        }
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
        return jsonify({"error": error}), 404

    return jsonify({
        "message": "category updated",
        "category": {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "status": category.status
        }
    })

@category_bp.route("", methods=["GET"])
def get_categories():

    categories = Category.query.all()

    return jsonify({
        "categories": [
            {
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "status": c.status,
                "subcategories": [
                    {
                        "id": s.id,
                        "name": s.name
                    }
                    for s in c.subcategories if s.status
                ]
            }
            for c in categories if c.status
        ]
    })

@category_bp.route("/<int:category_id>", methods=["GET"])
def get_category(category_id):

    category = CategoryService.get_category(category_id)

    if not category:
        return jsonify({"error": "category not found"}), 404

    return jsonify({
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "status": category.status
    })