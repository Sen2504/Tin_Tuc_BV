import os
from uuid import uuid4

from flask import current_app
from sqlalchemy.orm import joinedload
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models.banner import Banner
from app.models.banner_item import BannerItem
from app.models.media import Media


ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}


class BannerItemService:
    @staticmethod
    def _allowed_image_file(filename):
        if not filename or "." not in filename:
            return False
        ext = filename.rsplit(".", 1)[1].lower()
        return ext in ALLOWED_IMAGE_EXTENSIONS

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
            pass

    @staticmethod
    def _cleanup_unused_media(media_id):
        if not media_id:
            return

        media = Media.query.filter(Media.id == media_id).first()
        if not media:
            return

        still_used_in_banner = (
            BannerItem.query
            .filter(BannerItem.media_id == media_id)
            .first()
        )

        still_used_in_post = media.post_links[0] if media.post_links else None

        if still_used_in_banner or still_used_in_post:
            return

        BannerItemService._delete_media_file(media)
        db.session.delete(media)

    @staticmethod
    def _save_banner_image(file_storage):
        if not file_storage or not file_storage.filename:
            return None, "Ảnh banner không hợp lệ"

        if not BannerItemService._allowed_image_file(file_storage.filename):
            return None, "Ảnh banner phải là file ảnh hợp lệ (jpg, jpeg, png, webp, gif)"

        upload_folder = current_app.config.get("UPLOAD_FOLDER")
        if not upload_folder:
            return None, "UPLOAD_FOLDER chưa được cấu hình"

        banner_dir = os.path.join(upload_folder, "banner")
        os.makedirs(banner_dir, exist_ok=True)

        original_name = file_storage.filename
        safe_name = secure_filename(original_name)
        ext = safe_name.rsplit(".", 1)[1].lower()
        file_name = f"{uuid4().hex}.{ext}"

        absolute_path = os.path.join(banner_dir, file_name)
        file_storage.save(absolute_path)

        relative_path = os.path.relpath(absolute_path, current_app.root_path)
        relative_path = "/" + relative_path.replace("\\", "/")

        media = Media(
            original_name=original_name,
            file_name=file_name,
            file_path=relative_path,
            mime_type=file_storage.mimetype,
            file_size=os.path.getsize(absolute_path),
        )

        return media, None

    @staticmethod
    def get_banner_items():
        items = (
            BannerItem.query
            .options(
                joinedload(BannerItem.banner),
                joinedload(BannerItem.media)
            )
            .order_by(BannerItem.sort_order.asc(), BannerItem.id.desc())
            .all()
        )
        return items, None

    @staticmethod
    def get_banner_item_by_id(item_id):
        item = (
            BannerItem.query
            .options(
                joinedload(BannerItem.banner),
                joinedload(BannerItem.media)
            )
            .filter(BannerItem.id == item_id)
            .first()
        )

        if not item:
            return None, "banner item not found"

        return item, None

    @staticmethod
    def create_banner_item(banner_id, url=None, sort_order=0, status=True, image_file=None):
        banner = Banner.query.filter(Banner.id == banner_id).first()
        if not banner:
            return None, "Banner không tồn tại"

        if not image_file:
            return None, "Ảnh banner là bắt buộc"

        new_media = None
        try:
            new_media, error = BannerItemService._save_banner_image(image_file)
            if error:
                return None, error

            db.session.add(new_media)
            db.session.flush()

            item = BannerItem(
                banner_id=banner.id,
                media_id=new_media.id,
                url=(url.strip() if isinstance(url, str) and url.strip() else None),
                sort_order=sort_order if sort_order is not None else 0,
                status=status,
            )

            db.session.add(item)
            db.session.commit()

            item = (
                BannerItem.query
                .options(
                    joinedload(BannerItem.banner),
                    joinedload(BannerItem.media)
                )
                .filter(BannerItem.id == item.id)
                .first()
            )

            return item, None

        except Exception as e:
            db.session.rollback()

            if new_media and new_media.file_path:
                BannerItemService._delete_media_file(new_media)

            return None, str(e)

    @staticmethod
    def update_banner_item(item_id, banner_id=None, url=None, sort_order=None, status=None,
                           image_file=None, remove_image=False):
        item = (
            BannerItem.query
            .options(
                joinedload(BannerItem.banner),
                joinedload(BannerItem.media)
            )
            .filter(BannerItem.id == item_id)
            .first()
        )

        if not item:
            return None, "banner item not found"

        next_banner_id = item.banner_id
        next_url = item.url
        next_sort_order = item.sort_order
        next_status = item.status if status is None else status

        if banner_id is not None and banner_id != item.banner_id:
            banner = Banner.query.filter(Banner.id == banner_id).first()
            if not banner:
                return None, "Banner không tồn tại"
            next_banner_id = banner.id

        if url is not None:
            next_url = url.strip() or None

        if sort_order is not None:
            next_sort_order = sort_order

        old_media_id = item.media_id
        new_media = None

        try:
            if image_file:
                new_media, error = BannerItemService._save_banner_image(image_file)
                if error:
                    return None, error

                db.session.add(new_media)
                db.session.flush()

            item.banner_id = next_banner_id
            item.url = next_url
            item.sort_order = next_sort_order
            item.status = next_status

            if remove_image and item.media:
                item.media_id = None

            if new_media:
                item.media_id = new_media.id

            db.session.flush()

            if (remove_image and old_media_id and old_media_id != item.media_id) or (new_media and old_media_id and old_media_id != new_media.id):
                BannerItemService._cleanup_unused_media(old_media_id)

            db.session.commit()
            db.session.refresh(item)

            item = (
                BannerItem.query
                .options(
                    joinedload(BannerItem.banner),
                    joinedload(BannerItem.media)
                )
                .filter(BannerItem.id == item.id)
                .first()
            )

            return item, None

        except Exception as e:
            db.session.rollback()

            if new_media and new_media.file_path:
                BannerItemService._delete_media_file(new_media)

            return None, str(e)

    @staticmethod
    def delete_banner_item(item_id):
        item = BannerItem.query.filter(BannerItem.id == item_id).first()
        if not item:
            return False, "banner item not found"

        old_media_id = item.media_id

        try:
            db.session.delete(item)
            db.session.flush()

            BannerItemService._cleanup_unused_media(old_media_id)

            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)