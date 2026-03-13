from flask import Blueprint, request, jsonify

from app.services.subcategory_service import SubCategoryService


subcategory_bp = Blueprint(
    "subcategories",
    __name__,
    url_prefix="/api/subcategories"
)


@subcategory_bp.route("", methods=["POST"])
def create_subcategory():

    data = request.get_json(silent=True) or {}

    name = data.get("name")
    description = data.get("description")
    status = data.get("status", True)
    category_id = data.get("category_id")

    if not name:
        return jsonify({"error": "name is required"}), 400

    if not category_id:
        return jsonify({"error": "category_id is required"}), 400

    subcategory, error = SubCategoryService.create_subcategory(
        name=name,
        description=description,
        status=status,
        category_id=category_id
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "subcategory created",
        "subcategory": {
            "id": subcategory.id,
            "name": subcategory.name,
            "description": subcategory.description,
            "status": subcategory.status,
            "category_id": subcategory.category_id
        }
    }), 201


@subcategory_bp.route("/<int:subcategory_id>", methods=["PUT"])
def update_subcategory(subcategory_id):

    data = request.get_json(silent=True) or {}

    subcategory, error = SubCategoryService.update_subcategory(
        subcategory_id=subcategory_id,
        name=data.get("name"),
        description=data.get("description"),
        status=data.get("status"),
        category_id=data.get("category_id")
    )

    if error:
        return jsonify({"error": error}), 404

    return jsonify({
        "message": "subcategory updated",
        "subcategory": {
            "id": subcategory.id,
            "name": subcategory.name,
            "description": subcategory.description,
            "status": subcategory.status,
            "category_id": subcategory.category_id
        }
    })

@subcategory_bp.route("", methods=["GET"])
def get_subcategories():

    subcategories = SubCategoryService.get_subcategories()

    return jsonify({
        "subcategories": [
            {
                "id": s.id,
                "name": s.name,
                "description": s.description,
                "status": s.status,
                "category_id": s.category_id,
                "category_name": s.category.name
            }
            for s in subcategories
        ]
    })

@subcategory_bp.route("/<int:subcategory_id>", methods=["GET"])
def get_subcategory(subcategory_id):

    subcategory = SubCategoryService.get_subcategory(subcategory_id)

    if not subcategory:
        return jsonify({"error": "subcategory not found"}), 404

    return jsonify({
        "id": subcategory.id,
        "name": subcategory.name,
        "description": subcategory.description,
        "status": subcategory.status,
        "category_id": subcategory.category_id
    })