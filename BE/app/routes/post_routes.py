from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from app.services.post_service import PostService

post_bp = Blueprint("posts", __name__, url_prefix="/api/posts")


def to_bool(value, default=True):
    if value is None:
        return default

    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes", "on"}

    return bool(value)


# 1. Các route của ADMIN
# 1.1 Route để get all post của trang admin
@post_bp.route("", methods=["GET"])
@login_required
def get_post():
    data, error = PostService.get_post()

    if error:
        return jsonify({"error": error}), 400

    return jsonify(data), 200


@post_bp.route("/<int:post_id>", methods=["GET"])
@login_required
def get_post_by_id(post_id):
    data, error = PostService.get_post_by_id(post_id)

    if error:
        return jsonify({"error": error}), 404

    return jsonify(data), 200


@post_bp.route("", methods=["POST"])
@login_required
def create_post():
    data = request.get_json(silent=True) or {}

    title = (data.get("title") or "").strip()
    content = (data.get("content") or "").strip()
    hashtag = (data.get("hashtag") or "").strip() or None
    subcategory_id = data.get("subcategory_id")
    status = to_bool(data.get("status"), True)

    if not title:
        return jsonify({"error": "title is required"}), 400

    if not content:
        return jsonify({"error": "content is required"}), 400

    if not subcategory_id:
        return jsonify({"error": "subcategory_id is required"}), 400

    try:
        subcategory_id = int(subcategory_id)
    except (TypeError, ValueError):
        return jsonify({"error": "subcategory_id must be integer"}), 400

    post, error = PostService.create_post(
        title=title,
        content=content,
        hashtag=hashtag,
        status=status,
        subcategory_id=subcategory_id,
        author_id=current_user.id,
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Tạo bài viết thành công",
        "post": {
            "id": post.id,
            "title": post.title,
            "slug": post.slug,
            "content": post.content,
            "status": post.status,
            "hashtag": post.hashtag,
            "subcategory_id": post.subcategory_id,
            "user_id": post.user_id,
            "created_at": post.create_at.isoformat() if post.create_at else None,
            "updated_at": post.update_at.isoformat() if post.update_at else None,
        }
    }), 201


@post_bp.route("/<int:post_id>", methods=["PUT"])
@login_required
def update_post(post_id):
    data = request.get_json(silent=True) or {}

    subcategory_id = data.get("subcategory_id")
    if subcategory_id is not None:
        try:
            subcategory_id = int(subcategory_id)
        except (TypeError, ValueError):
            return jsonify({"error": "subcategory_id must be integer"}), 400

    status = data.get("status")
    if status is not None:
        status = to_bool(status, True)

    post, error = PostService.update_post(
        post_id=post_id,
        title=data.get("title"),
        content=data.get("content"),
        hashtag=data.get("hashtag"),
        status=status,
        subcategory_id=subcategory_id,
    )

    if error:
        status_code = 404 if "not found" in error.lower() else 400
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "post updated",
        "post": {
            "id": post.id,
            "title": post.title,
            "slug": post.slug,
            "content": post.content,
            "status": post.status,
            "hashtag": post.hashtag,
            "subcategory_id": post.subcategory_id,
            "user_id": post.user_id,
            "created_at": post.create_at.isoformat() if post.create_at else None,
            "updated_at": post.update_at.isoformat() if post.update_at else None,
            "author": {
                "id": post.author.id if post.author else None,
                "username": post.author.username if post.author else None,
            },
            "category": {
                "id": post.subcategory.category.id if post.subcategory and post.subcategory.category else None,
                "name": post.subcategory.category.name if post.subcategory and post.subcategory.category else None,
                "slug": post.subcategory.category.slug if post.subcategory and post.subcategory.category else None,
            },
            "subcategory": {
                "id": post.subcategory.id if post.subcategory else None,
                "name": post.subcategory.name if post.subcategory else None,
                "slug": post.subcategory.slug if post.subcategory else None,
            },
        }
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