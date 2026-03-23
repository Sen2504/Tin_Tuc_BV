import re

from app.extensions import db
from app.models.category import Category
from app.models.media import Media
from app.models.post import Post
from app.models.media_post import PostMedia
from app.models.sub_category import SubCategory
from sqlalchemy.orm import joinedload
import unicodedata

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
    def create_post(title, content, hashtag, status, subcategory_id, author_id):
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

        try:
            post = Post(
                title=title,
                slug=post_slug,   # thêm dòng này
                content=content,
                status=status,
                hashtag=hashtag,
                subcategory_id=subcategory.id,
                user_id=author_id,
            )

            db.session.add(post)
            db.session.flush()

            if media_ids:
                medias = Media.query.filter(Media.id.in_(media_ids)).all()
                existing_ids = {m.id for m in medias}

                missing_ids = [mid for mid in media_ids if mid not in existing_ids]
                if missing_ids:
                    db.session.rollback()
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

        result = {
            "posts": [
                {
                    "id": post.id,
                    "title": post.title,
                    "slug": post.slug,
                    "content": post.content,
                    "excerpt": strip_html(post.content)[:180],
                    "status": post.status,
                    "hashtag": post.hashtag,
                    "create_at": post.create_at.isoformat() if post.create_at else None,
                    "update_at": post.update_at.isoformat() if post.update_at else None,
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
                for post in posts
            ]
        }

        return result, None

    @staticmethod
    def update_post(post_id, title=None, content=None, hashtag=None, status=None, subcategory_id=None):
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

        media_ids = PostService._extract_media_ids_from_content(next_content)

        try:
            post.title = next_title
            post.slug = next_slug
            post.content = next_content
            post.hashtag = next_hashtag
            post.status = next_status
            post.subcategory = next_subcategory

            db.session.query(PostMedia).filter_by(post_id=post.id).delete()

            if media_ids:
                medias = Media.query.filter(Media.id.in_(media_ids)).all()
                existing_ids = {m.id for m in medias}

                missing_ids = [mid for mid in media_ids if mid not in existing_ids]
                if missing_ids:
                    db.session.rollback()
                    return None, f"Media không tồn tại: {missing_ids}"

                for media_id in media_ids:
                    link = PostMedia(
                        post_id=post.id,
                        media_id=media_id
                    )
                    db.session.add(link)

            db.session.commit()
            db.session.refresh(post)

            return post, None

        except Exception as e:
            db.session.rollback()
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

        result = {
            "post": {
                "id": post.id,
                "title": post.title,
                "slug": post.slug,
                "content": post.content,
                "status": post.status,
                "hashtag": post.hashtag,
                "subcategory_id": post.subcategory_id,
                "user_id": post.user_id,
                "create_at": post.create_at.isoformat() if post.create_at else None,
                "update_at": post.update_at.isoformat() if post.update_at else None,
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
        }

        return result, None