from flask import Blueprint, request, jsonify
from app.services.subcategory_service import SubCategoryService


subcategory_bp = Blueprint(
    "subcategories",
    __name__,
    url_prefix="/api/subcategories"
)


def parse_bool(value, default=None):
    if value is None or value == "":
        return default

    if isinstance(value, bool):
        return value

    return str(value).strip().lower() in {"true", "1", "yes", "on", "active"}


def serialize_media(media):
    if not media:
        return None

    return {
        "id": media.id,
        "original_name": media.original_name,
        "file_name": media.file_name,
        "file_path": media.file_path,
        "mime_type": media.mime_type,
        "file_size": media.file_size,
        "caption": media.caption,
    }


def serialize_subcategory(subcategory):
    return {
        "id": subcategory.id,
        "name": subcategory.name,
        "slug": subcategory.slug,
        "description": subcategory.description,
        "status": subcategory.status,
        "category_id": subcategory.category_id,
        "category_name": subcategory.category.name if subcategory.category else None,
        "thumbnail_media_id": subcategory.thumbnail_media_id,
        "thumbnail": serialize_media(subcategory.thumbnail_media),
    }


@subcategory_bp.route("", methods=["POST"])
def create_subcategory():
    data = request.form
    thumbnail_file = request.files.get("thumbnail")

    name = data.get("name")
    description = data.get("description")
    status = parse_bool(data.get("status"), True)
    category_id = data.get("category_id")

    if not name:
        return jsonify({"error": "name is required"}), 400

    if not category_id:
        return jsonify({"error": "category_id is required"}), 400

    try:
        category_id = int(category_id)
    except ValueError:
        return jsonify({"error": "category_id must be an integer"}), 400

    subcategory, error = SubCategoryService.create_subcategory(
        name=name,
        description=description,
        status=status,
        category_id=category_id,
        thumbnail_file=thumbnail_file
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "subcategory created",
        "subcategory": serialize_subcategory(subcategory)
    }), 201


@subcategory_bp.route("/<int:subcategory_id>", methods=["PUT"])
def update_subcategory(subcategory_id):
    data = request.form if request.form else (request.get_json(silent=True) or {})
    thumbnail_file = request.files.get("thumbnail")

    category_id = data.get("category_id")
    if category_id not in (None, ""):
        try:
            category_id = int(category_id)
        except ValueError:
            return jsonify({"error": "category_id must be an integer"}), 400
    else:
        category_id = None

    remove_thumbnail = parse_bool(data.get("remove_thumbnail"), False)

    subcategory, error = SubCategoryService.update_subcategory(
        subcategory_id=subcategory_id,
        name=data.get("name"),
        description=data.get("description"),
        status=parse_bool(data.get("status"), None),
        category_id=category_id,
        thumbnail_file=thumbnail_file,
        remove_thumbnail=remove_thumbnail
    )

    if error:
        status_code = 404 if "not found" in error else 400
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "subcategory updated",
        "subcategory": serialize_subcategory(subcategory)
    })


@subcategory_bp.route("", methods=["GET"])
def get_subcategories():
    subcategories = SubCategoryService.get_subcategories()

    return jsonify({
        "subcategories": [
            serialize_subcategory(s)
            for s in subcategories
        ]
    })


@subcategory_bp.route("/<int:subcategory_id>", methods=["GET"])
def get_subcategory(subcategory_id):
    subcategory = SubCategoryService.get_subcategory(subcategory_id)

    if not subcategory:
        return jsonify({"error": "subcategory not found"}), 404

    return jsonify(serialize_subcategory(subcategory))