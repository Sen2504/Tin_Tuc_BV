import re

from app.extensions import db
from app.models.category import Category
from app.models.media import Media
from app.models.post import Post
from app.models.media_post import PostMedia
from app.models.sub_category import SubCategory
from sqlalchemy.orm import joinedload
import unicodedata
import os
from flask import current_app
from uuid import uuid4
from werkzeug.utils import secure_filename

ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}

def strip_html(value):
    if not value:
        return ""
    return re.sub(r"<[^>]+>", "", value).strip()

def slugify(value):
    if not value:
        return ""

    value = unicodedata.normalize("NFD", value)
    value = value.encode("ascii", "ignore").decode("utf-8")
    value = value.lower()
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    value = re.sub(r"[\s_-]+", "-", value)
    value = re.sub(r"^-+|-+$", "", value)
    return value


def generate_unique_post_slug(title, subcategory_id):
    base_slug = slugify(title)

    if not base_slug:
        base_slug = "bai-viet"

    slug = base_slug
    counter = 1

    while Post.query.filter_by(subcategory_id=subcategory_id, slug=slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug

def generate_unique_post_slug_for_update(title, subcategory_id, exclude_post_id=None):
    base_slug = slugify(title)

    if not base_slug:
        base_slug = "bai-viet"

    slug = base_slug
    counter = 1

    while True:
        query = Post.query.filter_by(
            subcategory_id=subcategory_id,
            slug=slug
        )

        if exclude_post_id is not None:
            query = query.filter(Post.id != exclude_post_id)

        existed_post = query.first()

        if not existed_post:
            return slug

        slug = f"{base_slug}-{counter}"
        counter += 1

class PostService:
    @staticmethod
    def _extract_media_ids_from_content(content: str) -> list[int]:
        """
        Lấy media_id từ src ảnh kiểu:
        http://localhost:5000/api/media/files/abc.jpg?mid=12
        """
        if not content:
            return []

        found = re.findall(r"[?&]mid=(\d+)", content)
        ids = []
        seen = set()

        for item in found:
            media_id = int(item)
            if media_id not in seen:
                seen.add(media_id)
                ids.append(media_id)

        return ids
    
    @staticmethod
    def _get_media_ids_of_post(post_id: int) -> list[int]:
        rows = (
            db.session.query(PostMedia.media_id)
            .filter(PostMedia.post_id == post_id)
            .all()
        )
        return [row[0] for row in rows]
    
    @staticmethod
    def _delete_media_file(media):
        if not media or not media.file_path:
            return

        try:
            relative_path = media.file_path.lstrip("/\\")
            absolute_path = os.path.join(current_app.root_path, relative_path)

            if os.path.exists(absolute_path):
                os.remove(absolute_path)
        except Exception:
            # Có thể log ra nếu muốn, nhưng đừng làm crash cả request
            pass

    @staticmethod
    def _cleanup_unused_medias(media_ids: list[int]):
        if not media_ids:
            return

        unique_ids = list(set(media_ids))

        for media_id in unique_ids:
            still_used = (
                db.session.query(PostMedia.id)
                .filter(PostMedia.media_id == media_id)
                .first()
            )

            if still_used:
                continue

            media = Media.query.filter(Media.id == media_id).first()
            if not media:
                continue

            PostService._delete_media_file(media)
            db.session.delete(media)

    @staticmethod
    def _allowed_image_file(filename):
        if not filename or "." not in filename:
            return False
        ext = filename.rsplit(".", 1)[1].lower()
        return ext in ALLOWED_IMAGE_EXTENSIONS

    @staticmethod
    def _delete_post_thumbnail_file(post):
        if not post or not post.thumbnail_path:
            return

        try:
            relative_path = post.thumbnail_path.lstrip("/\\")
            absolute_path = os.path.join(current_app.root_path, relative_path)

            if os.path.exists(absolute_path):
                os.remove(absolute_path)
        except Exception:
            pass

    @staticmethod
    def _clear_post_thumbnail(post):
        PostService._delete_post_thumbnail_file(post)

        post.thumbnail_original_name = None
        post.thumbnail_file_name = None
        post.thumbnail_path = None
        post.thumbnail_mime_type = None
        post.thumbnail_file_size = None

    @staticmethod
    def _save_post_thumbnail(file_storage):
        if not file_storage or not file_storage.filename:
            return None, "Thumbnail không hợp lệ"

        if not PostService._allowed_image_file(file_storage.filename):
            return None, "Thumbnail phải là file ảnh hợp lệ (jpg, jpeg, png, webp, gif)"

        upload_folder = current_app.config.get("UPLOAD_FOLDER")
        if not upload_folder:
            return None, "UPLOAD_FOLDER chưa được cấu hình"

        thumbnail_dir = os.path.join(upload_folder, "thumbnail_post")
        os.makedirs(thumbnail_dir, exist_ok=True)

        original_name = file_storage.filename
        safe_name = secure_filename(original_name)
        ext = safe_name.rsplit(".", 1)[1].lower()
        file_name = f"{uuid4().hex}.{ext}"

        absolute_path = os.path.join(thumbnail_dir, file_name)
        file_storage.save(absolute_path)

        relative_path = os.path.relpath(absolute_path, current_app.root_path)
        relative_path = "/" + relative_path.replace("\\", "/")

        thumbnail_data = {
            "thumbnail_original_name": original_name,
            "thumbnail_file_name": file_name,
            "thumbnail_path": relative_path,
            "thumbnail_mime_type": file_storage.mimetype,
            "thumbnail_file_size": os.path.getsize(absolute_path),
        }

        return thumbnail_data, None

    @staticmethod
    def create_post(title, content, hashtag, status, subcategory_id, author_id, thumbnail_file=None):
        subcategory = (
            db.session.query(SubCategory)
            .join(Category, SubCategory.category_id == Category.id)
            .filter(
                SubCategory.id == subcategory_id,
                SubCategory.status.is_(True),
                Category.status.is_(True),
            )
            .first()
        )

        if not subcategory:
            return None, "Subcategory không tồn tại hoặc đang bị khóa"

        media_ids = PostService._extract_media_ids_from_content(content)
        post_slug = generate_unique_post_slug(title, subcategory.id)

        thumbnail_data = None
        if thumbnail_file:
            thumbnail_data, error = PostService._save_post_thumbnail(thumbnail_file)
            if error:
                return None, error

        try:
            post = Post(
                title=title,
                slug=post_slug,
                content=content,
                status=status,
                hashtag=hashtag,
                subcategory_id=subcategory.id,
                user_id=author_id,
            )

            if thumbnail_data:
                post.thumbnail_original_name = thumbnail_data["thumbnail_original_name"]
                post.thumbnail_file_name = thumbnail_data["thumbnail_file_name"]
                post.thumbnail_path = thumbnail_data["thumbnail_path"]
                post.thumbnail_mime_type = thumbnail_data["thumbnail_mime_type"]
                post.thumbnail_file_size = thumbnail_data["thumbnail_file_size"]

            db.session.add(post)
            db.session.flush()

            if media_ids:
                medias = Media.query.filter(Media.id.in_(media_ids)).all()
                existing_ids = {m.id for m in medias}

                missing_ids = [mid for mid in media_ids if mid not in existing_ids]
                if missing_ids:
                    db.session.rollback()

                    if thumbnail_data and post.thumbnail_path:
                        PostService._delete_post_thumbnail_file(post)

                    return None, f"Media không tồn tại: {missing_ids}"

                for media_id in media_ids:
                    link = PostMedia(
                        post_id=post.id,
                        media_id=media_id
                    )
                    db.session.add(link)

            db.session.commit()
            return post, None

        except Exception as e:
            db.session.rollback()

            if thumbnail_data and thumbnail_data.get("thumbnail_path"):
                fake_post = type("FakePost", (), thumbnail_data)
                fake_post.thumbnail_path = thumbnail_data["thumbnail_path"]
                PostService._delete_post_thumbnail_file(fake_post)

            return None, str(e)

    @staticmethod
    def get_posts_by_subcategory_slugs(category_slug, subcategory_slug):
        subcategory = (
            SubCategory.query
            .join(Category, SubCategory.category_id == Category.id)
            .options(joinedload(SubCategory.category))
            .filter(
                Category.slug == category_slug,
                Category.status.is_(True),
                SubCategory.slug == subcategory_slug,
                SubCategory.status.is_(True),
            )
            .first()
        )

        if not subcategory:
            return None, "subcategory not found"

        posts = (
            Post.query
            .options(joinedload(Post.author))
            .filter(
                Post.subcategory_id == subcategory.id,
                Post.status.is_(True)
            )
            .order_by(Post.create_at.desc())
            .all()
        )

        result = {
            "category": {
                "id": subcategory.category.id,
                "name": subcategory.category.name,
                "slug": subcategory.category.slug,
            },
            "subcategory": {
                "id": subcategory.id,
                "name": subcategory.name,
                "slug": subcategory.slug,
                "description": subcategory.description,
            },
            "total_posts": len(posts),
            "posts": [
                {
                    "id": post.id,
                    "title": post.title,
                    "slug": post.slug,
                    "hashtag": post.hashtag,
                    "excerpt": strip_html(post.content)[:180],
                    "create_at": post.create_at.isoformat() if post.create_at else None,
                    "author": {
                        "id": post.author.id if post.author else None,
                        "username": post.author.username if post.author else None,
                    },
                    "thumbnail": {
                        "original_name": post.thumbnail_original_name,
                        "file_name": post.thumbnail_file_name,
                        "file_path": post.thumbnail_path,
                        "mime_type": post.thumbnail_mime_type,
                        "file_size": post.thumbnail_file_size,
                    } if post.thumbnail_path else None,
                }
                for post in posts
            ]
        }

        return result, None

    @staticmethod
    def get_post_detail_by_slugs(category_slug, subcategory_slug, post_slug):
        post = (
            Post.query
            .join(SubCategory, Post.subcategory_id == SubCategory.id)
            .join(Category, SubCategory.category_id == Category.id)
            .options(
                joinedload(Post.author),
                joinedload(Post.subcategory).joinedload(SubCategory.category),
            )
            .filter(
                Category.slug == category_slug,
                Category.status.is_(True),
                SubCategory.slug == subcategory_slug,
                SubCategory.status.is_(True),
                Post.slug == post_slug,
                Post.status.is_(True),
            )
            .first()
        )

        if not post:
            return None, "post not found"

        result = {
            "post": {
                "id": post.id,
                "title": post.title,
                "slug": post.slug,
                "content": post.content,
                "hashtag": post.hashtag,
                "create_at": post.create_at.isoformat() if post.create_at else None,
                "update_at": post.update_at.isoformat() if post.update_at else None,
                "author": {
                    "id": post.author.id if post.author else None,
                    "username": post.author.username if post.author else None,
                },
                "category": {
                    "id": post.subcategory.category.id,
                    "name": post.subcategory.category.name,
                    "slug": post.subcategory.category.slug,
                },
                "subcategory": {
                    "id": post.subcategory.id,
                    "name": post.subcategory.name,
                    "slug": post.subcategory.slug,
                },
                "thumbnail": {
                    "original_name": post.thumbnail_original_name,
                    "file_name": post.thumbnail_file_name,
                    "file_path": post.thumbnail_path,
                    "mime_type": post.thumbnail_mime_type,
                    "file_size": post.thumbnail_file_size,
                } if post.thumbnail_path else None,
            }
        }

        return result, None
    
    @staticmethod
    def get_post():
        posts = (
            Post.query
            .join(SubCategory, Post.subcategory_id == SubCategory.id)
            .join(Category, SubCategory.category_id == Category.id)
            .options(
                joinedload(Post.author),
                joinedload(Post.subcategory).joinedload(SubCategory.category),
            )
            .order_by(Post.id.desc())
            .all()
        )

        return posts, None

    @staticmethod
    def update_post(post_id, title=None, content=None, hashtag=None, status=None, 
        subcategory_id=None,
        thumbnail_file=None,
        remove_thumbnail=False
    ):
        post = (
            Post.query
            .options(
                joinedload(Post.author),
                joinedload(Post.subcategory).joinedload(SubCategory.category),
            )
            .filter(Post.id == post_id)
            .first()
        )

        if not post:
            return None, "post not found"

        next_title = post.title
        next_content = post.content
        next_hashtag = post.hashtag
        next_status = post.status if status is None else status
        next_subcategory = post.subcategory

        if title is not None:
            title = title.strip()
            if not title:
                return None, "title is required"
            next_title = title

        if content is not None:
            content = content.strip()
            if not content:
                return None, "content is required"
            next_content = content

        if hashtag is not None:
            next_hashtag = (hashtag or "").strip() or None

        if subcategory_id is not None and subcategory_id != post.subcategory_id:
            subcategory = (
                db.session.query(SubCategory)
                .join(Category, SubCategory.category_id == Category.id)
                .filter(
                    SubCategory.id == subcategory_id,
                    SubCategory.status.is_(True),
                    Category.status.is_(True),
                )
                .first()
            )

            if not subcategory:
                return None, "Subcategory không tồn tại hoặc đang bị khóa"

            next_subcategory = subcategory

        should_regenerate_slug = (
            next_title != post.title or
            next_subcategory.id != post.subcategory_id
        )

        next_slug = post.slug
        if should_regenerate_slug:
            next_slug = generate_unique_post_slug_for_update(
                title=next_title,
                subcategory_id=next_subcategory.id,
                exclude_post_id=post.id
            )

        old_media_ids = PostService._get_media_ids_of_post(post.id)
        new_media_ids = PostService._extract_media_ids_from_content(next_content)

        new_thumbnail_data = None
        if thumbnail_file:
            new_thumbnail_data, error = PostService._save_post_thumbnail(thumbnail_file)
            if error:
                return None, error

        old_thumbnail_path = post.thumbnail_path
        old_thumbnail_original_name = post.thumbnail_original_name
        old_thumbnail_file_name = post.thumbnail_file_name
        old_thumbnail_mime_type = post.thumbnail_mime_type
        old_thumbnail_file_size = post.thumbnail_file_size

        try:
            if new_media_ids:
                medias = Media.query.filter(Media.id.in_(new_media_ids)).all()
                existing_ids = {m.id for m in medias}

                missing_ids = [mid for mid in new_media_ids if mid not in existing_ids]
                if missing_ids:
                    if new_thumbnail_data:
                        fake_post = type("FakePost", (), {})()
                        fake_post.thumbnail_path = new_thumbnail_data["thumbnail_path"]
                        PostService._delete_post_thumbnail_file(fake_post)

                    return None, f"Media không tồn tại: {missing_ids}"

            post.title = next_title
            post.slug = next_slug
            post.content = next_content
            post.hashtag = next_hashtag
            post.status = next_status
            post.subcategory = next_subcategory

            if remove_thumbnail:
                PostService._clear_post_thumbnail(post)

            if new_thumbnail_data:
                PostService._clear_post_thumbnail(post)

                post.thumbnail_original_name = new_thumbnail_data["thumbnail_original_name"]
                post.thumbnail_file_name = new_thumbnail_data["thumbnail_file_name"]
                post.thumbnail_path = new_thumbnail_data["thumbnail_path"]
                post.thumbnail_mime_type = new_thumbnail_data["thumbnail_mime_type"]
                post.thumbnail_file_size = new_thumbnail_data["thumbnail_file_size"]

            db.session.query(PostMedia).filter_by(post_id=post.id).delete()

            for media_id in new_media_ids:
                db.session.add(PostMedia(
                    post_id=post.id,
                    media_id=media_id
                ))

            db.session.flush()

            removed_media_ids = list(set(old_media_ids) - set(new_media_ids))
            PostService._cleanup_unused_medias(removed_media_ids)

            db.session.commit()
            db.session.refresh(post)

            return post, None

        except Exception as e:
            db.session.rollback()

            if new_thumbnail_data:
                fake_post = type("FakePost", (), {})()
                fake_post.thumbnail_path = new_thumbnail_data["thumbnail_path"]
                PostService._delete_post_thumbnail_file(fake_post)

            post.thumbnail_path = old_thumbnail_path
            post.thumbnail_original_name = old_thumbnail_original_name
            post.thumbnail_file_name = old_thumbnail_file_name
            post.thumbnail_mime_type = old_thumbnail_mime_type
            post.thumbnail_file_size = old_thumbnail_file_size

            return None, str(e)
        
    @staticmethod
    def get_post_by_id(post_id):
        post = (
            Post.query
            .options(
                joinedload(Post.author),
                joinedload(Post.subcategory).joinedload(SubCategory.category),
            )
            .filter(Post.id == post_id)
            .first()
        )

        if not post:
            return None, "post not found"

        return post, None

    @staticmethod
    def delete_post(post_id):
        post = Post.query.filter(Post.id == post_id).first()

        if not post:
            return False, "post not found"

        media_ids = PostService._get_media_ids_of_post(post.id)

        try:
            PostService._delete_post_thumbnail_file(post)

            db.session.delete(post)
            db.session.flush()

            PostService._cleanup_unused_medias(media_ids)

            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)