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