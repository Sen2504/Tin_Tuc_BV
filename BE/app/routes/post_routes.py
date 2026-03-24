from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from app.services.post_service import PostService
from marshmallow import ValidationError
from app.schemas.post_schema import (
    PostCreateSchema,
    PostUpdateSchema,
    PostResponseSchema,
    PostPublicListItemSchema,
    PostPublicDetailSchema,
)

post_bp = Blueprint("posts", __name__, url_prefix="/api/posts")

post_create_schema = PostCreateSchema()
post_update_schema = PostUpdateSchema()

post_response_schema = PostResponseSchema()
posts_response_schema = PostResponseSchema(many=True)

post_public_list_item_schema = PostPublicListItemSchema(many=True)
post_public_detail_schema = PostPublicDetailSchema()


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

# 1. Các route của ADMIN
# 1.1 Route để get all post của trang admin
@post_bp.route("", methods=["GET"])
@login_required
def get_post():
    posts, error = PostService.get_post()

    if error:
        return jsonify({"error": error}), 400

    return jsonify(posts_response_schema.dump(posts)), 200


@post_bp.route("/<int:post_id>", methods=["GET"])
@login_required
def get_post_by_id(post_id):
    post, error = PostService.get_post_by_id(post_id)

    if error:
        return jsonify({"error": error}), 404

    return jsonify(post_response_schema.dump(post)), 200


@post_bp.route("", methods=["POST"])
@login_required
def create_post():
    data = request.get_json(silent=True) or {}

    try:
        validated_data = post_create_schema.load(data)
    except ValidationError as err:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": err.messages
        }), 400

    post, error = PostService.create_post(
        title=validated_data.get("title"),
        content=validated_data.get("content"),
        hashtag=validated_data.get("hashtag"),
        status=parse_bool(validated_data.get("status", True)),
        subcategory_id=parse_int(validated_data.get("subcategory_id"), "subcategory_id"),
        author_id=current_user.id,
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Tạo bài viết thành công",
        "post": post_response_schema.dump(post)
    }), 201


@post_bp.route("/<int:post_id>", methods=["PUT"])
@login_required
def update_post(post_id):
    data = request.get_json(silent=True) or {}

    try:
        validated_data = post_update_schema.load(data)
    except ValidationError as err:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": err.messages
        }), 400

    post, error = PostService.update_post(
        post_id=post_id,
        title=validated_data.get("title"),
        content=validated_data.get("content"),
        hashtag=validated_data.get("hashtag"),
        status=parse_bool(validated_data["status"]) if "status" in validated_data else None,
        subcategory_id=parse_int(validated_data["subcategory_id"], "subcategory_id") if "subcategory_id" in validated_data else None,
    )

    if error:
        status_code = 404 if "not found" in error.lower() else 400
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "Bài viết đã được cập nhật",
        "post": post_response_schema.dump(post)
    }), 200


@post_bp.route("/<int:post_id>", methods=["DELETE"])
@login_required
def delete_post(post_id):
    deleted, error = PostService.delete_post(post_id)

    if error:
        status_code = 404 if "not found" in error.lower() else 400
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "Xóa bài viết thành công"
    }), 200


# 2. Các route PUBLIC ra giao diện
@post_bp.route("/<string:category_slug>/<string:subcategory_slug>", methods=["GET"])
def get_posts_by_subcategory(category_slug, subcategory_slug):
    data, error = PostService.get_posts_by_subcategory_slugs(
        category_slug=category_slug,
        subcategory_slug=subcategory_slug
    )

    if error:
        return jsonify({"error": error}), 404

    return jsonify(data), 200


@post_bp.route("/<string:category_slug>/<string:subcategory_slug>/<string:post_slug>", methods=["GET"])
def get_post_detail(category_slug, subcategory_slug, post_slug):
    data, error = PostService.get_post_detail_by_slugs(
        category_slug=category_slug,
        subcategory_slug=subcategory_slug,
        post_slug=post_slug
    )

    if error:
        return jsonify({"error": error}), 404

    return jsonify(data), 200