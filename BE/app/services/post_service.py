import re

from app.extensions import db
from app.models.category import Category
from app.models.media import Media
from app.models.post import Post
from app.models.media_post import PostMedia
from app.models.sub_category import SubCategory


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

        try:
            post = Post(
                title=title,
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

        except Exception:
            db.session.rollback()
            return None, "Tạo bài viết thất bại"