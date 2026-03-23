import os
import uuid

from flask import current_app
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models.sub_category import SubCategory
from app.models.category import Category
from app.models.media import Media
from app.utils.slug import generate_unique_slug


class SubCategoryService:
    ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}

    @staticmethod
    def _save_thumbnail_file(file, caption=None):
        if not file or not file.filename:
            return None, None

        original_name = secure_filename(file.filename)
        extension = os.path.splitext(original_name)[1].lower().replace(".", "")

        if extension not in SubCategoryService.ALLOWED_IMAGE_EXTENSIONS:
            return None, "Thumbnail phải là jpg, jpeg, png, webp, or gif"

        upload_root = current_app.config.get(
            "UPLOAD_FOLDER",
            os.path.join(current_app.root_path, "uploads")
        )

        upload_dir = os.path.join(upload_root, "subcategories")
        os.makedirs(upload_dir, exist_ok=True)

        unique_name = f"{uuid.uuid4().hex}.{extension}"
        absolute_path = os.path.join(upload_dir, unique_name)

        file.save(absolute_path)

        media = Media(
            original_name=original_name,
            file_name=unique_name,
            file_path=f"/uploads/subcategories/{unique_name}",
            mime_type=file.mimetype,
            file_size=os.path.getsize(absolute_path),
            caption=caption
        )

        db.session.add(media)
        db.session.flush()

        return media, None

    @staticmethod
    def create_subcategory(name, category_id, description=None, status=True, thumbnail_file=None):
        category = Category.query.get(category_id)

        if not category:
            return None, "Danh mục không tìm thấy"

        normalized_name = (name or "").strip()

        if not normalized_name:
            return None, "Tên danh mục con là bắt buộc"

        existing = SubCategory.query.filter_by(
            name=normalized_name,
            category_id=category_id
        ).first()

        if existing:
            return None, "Danh mục con đã tồn tại"

        thumbnail_media = None
        if thumbnail_file:
            thumbnail_media, error = SubCategoryService._save_thumbnail_file(
                thumbnail_file,
                caption=f"Thumbnail - {normalized_name}"
            )
            if error:
                return None, error

        slug = generate_unique_slug(SubCategory, normalized_name)

        subcategory = SubCategory(
            name=normalized_name,
            slug=slug,
            description=description,
            status=status,
            category_id=category_id,
            thumbnail_media_id=thumbnail_media.id if thumbnail_media else None
        )

        db.session.add(subcategory)
        db.session.commit()

        return subcategory, None

    @staticmethod
    def update_subcategory(
        subcategory_id,
        name=None,
        description=None,
        status=None,
        category_id=None,
        thumbnail_file=None,
        remove_thumbnail=False
    ):
        subcategory = SubCategory.query.get(subcategory_id)

        if not subcategory:
            return None, "Danh mục con không tìm thấy"

        next_name = subcategory.name
        next_category_id = subcategory.category_id

        if name is not None and name.strip():
            next_name = name.strip()

        if category_id is not None:
            category = Category.query.get(category_id)
            if not category:
                return None, "Danh mục không tìm thấy"
            next_category_id = category_id

        duplicated = SubCategory.query.filter(
            SubCategory.name == next_name,
            SubCategory.category_id == next_category_id,
            SubCategory.id != subcategory_id
        ).first()

        if duplicated:
            return None, "Danh mục con đã tồn tại"

        if name is not None and name.strip():
            subcategory.name = next_name
            subcategory.slug = generate_unique_slug(
                SubCategory,
                next_name,
                current_id=subcategory_id
            )

        if description is not None:
            subcategory.description = description

        if status is not None:
            subcategory.status = status

        if category_id is not None:
            subcategory.category_id = category_id

        if remove_thumbnail:
            subcategory.thumbnail_media_id = None

        if thumbnail_file:
            thumbnail_media, error = SubCategoryService._save_thumbnail_file(
                thumbnail_file,
                caption=f"Thumbnail - {subcategory.name}"
            )
            if error:
                return None, error

            subcategory.thumbnail_media_id = thumbnail_media.id

        db.session.commit()

        return subcategory, None

    @staticmethod
    def get_subcategories():
        return SubCategory.query.order_by(SubCategory.id).all()

    @staticmethod
    def get_subcategory(subcategory_id):
        return SubCategory.query.get(subcategory_id)

    @staticmethod
    def get_subcategory_by_slug(slug):
        return SubCategory.query.filter_by(slug=slug, status=True).first()

    @staticmethod
    def delete_subcategory(subcategory_id):
        subcategory = SubCategory.query.get(subcategory_id)

        if not subcategory:
            return False, "Danh mục con không tìm thấy"

        try:
            db.session.delete(subcategory)
            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)