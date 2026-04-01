import os

from sqlalchemy.orm import joinedload, selectinload, load_only

from app.extensions import db
from app.models.banner import Banner
from app.models.banner_item import BannerItem
from app.models.media import Media
from app.services.banner_item_service import BannerItemService


class BannerService:
    @staticmethod
    def _deactivate_active_banners(exclude_banner_id=None):
        query = Banner.query.filter(Banner.status.is_(True))

        if exclude_banner_id is not None:
            query = query.filter(Banner.id != exclude_banner_id)

        query.update({Banner.status: False}, synchronize_session=False)

    @staticmethod
    def get_banners():
        banners = (
            Banner.query
            .options(
                load_only(Banner.id, Banner.status, Banner.create_at),
                selectinload(Banner.banner_items)
                .load_only(
                    BannerItem.id,
                    BannerItem.status,
                    BannerItem.sort_order,
                    BannerItem.media_id,
                )
                .selectinload(BannerItem.media)
                .load_only(Media.file_path)
            )
            .order_by(Banner.id.desc())
            .all()
        )
        return banners, None

    @staticmethod
    def get_banner_by_id(banner_id):
        banner = (
            Banner.query
            .options(
                load_only(
                    Banner.id,
                    Banner.status,
                    Banner.create_at,
                    Banner.update_at,
                ),
                joinedload(Banner.banner_items)
                .load_only(
                    BannerItem.id,
                    BannerItem.url,
                    BannerItem.sort_order,
                    BannerItem.status,
                    BannerItem.media_id,
                )
                .joinedload(BannerItem.media)
                .load_only(Media.file_path)
            )
            .filter(Banner.id == banner_id)
            .first()
        )

        if not banner:
            return None, "banner not found"

        return banner, None

    @staticmethod
    def create_banner(status=True):
        try:
            if status:
                BannerService._deactivate_active_banners()

            banner = Banner(status=status)

            db.session.add(banner)
            db.session.commit()
            return banner, None
        except Exception as e:
            db.session.rollback()
            return None, str(e)

    @staticmethod
    def create_banner_full(status=True, items_data=None, files_map=None):
        items_data = items_data or []
        files_map = files_map or {}

        if not items_data:
            return None, "Phải có ít nhất 1 banner item"

        saved_media_objects = []

        try:
            if status:
                BannerService._deactivate_active_banners()

            banner = Banner(status=status)
            db.session.add(banner)
            db.session.flush()

            for item_data in items_data:
                image_key = item_data["image_key"]
                image_file = files_map.get(image_key)

                if not image_file:
                    raise ValueError(f"Thiếu file ảnh cho item: {image_key}")

                media, error = BannerItemService._save_banner_image(image_file)
                if error:
                    raise ValueError(error)

                db.session.add(media)
                db.session.flush()
                saved_media_objects.append(media)

                banner_item = BannerItem(
                    banner_id=banner.id,
                    media_id=media.id,
                    url=(item_data.get("url").strip() if isinstance(item_data.get("url"), str) and item_data.get("url").strip() else None),
                    sort_order=item_data.get("sort_order", 0),
                    status=item_data.get("status", True),
                )

                db.session.add(banner_item)

            db.session.commit()

            return {
                "id": banner.id,
                "status": banner.status,
                "items_count": len(items_data),
            }, None

        except Exception as e:
            db.session.rollback()

            for media in saved_media_objects:
                try:
                    BannerItemService._delete_media_file(media)
                except Exception:
                    pass

            return None, str(e)

    @staticmethod
    def update_banner(banner_id, status=None):
        banner = (
            Banner.query
            .options(
                joinedload(Banner.banner_items).joinedload(BannerItem.media)
            )
            .filter(Banner.id == banner_id)
            .first()
        )

        if not banner:
            return None, "banner not found"

        if status is not None:
            banner.status = status

            if status:
                BannerService._deactivate_active_banners(exclude_banner_id=banner.id)

        try:
            db.session.commit()
            db.session.refresh(banner)
            return banner, None
        except Exception as e:
            db.session.rollback()
            return None, str(e)

    @staticmethod
    def delete_banner(banner_id):
        banner = (
            Banner.query
            .options(joinedload(Banner.banner_items))
            .filter(Banner.id == banner_id)
            .first()
        )

        if not banner:
            return False, "banner not found"

        media_ids = [item.media_id for item in banner.banner_items if item.media_id]

        try:
            db.session.delete(banner)
            db.session.flush()

            for media_id in set(media_ids):
                BannerItemService._cleanup_unused_media(media_id)

            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)

    @staticmethod
    def get_active_banner_public():
        banners = (
            Banner.query
            .options(
                joinedload(Banner.banner_items).joinedload(BannerItem.media)
            )
            .filter(Banner.status.is_(True))
            .order_by(Banner.id.desc())
            .all()
        )

        result = []
        for banner in banners:
            active_items = [
                item for item in (banner.banner_items or [])
                if item.status and item.media
            ]

            if not active_items:
                continue

            result.append({
                "id": banner.id,
                "status": banner.status,
                "banner_items": [
                    {
                        "id": item.id,
                        "url": item.url,
                        "sort_order": item.sort_order,
                        "status": item.status,
                        "media": {
                            "id": item.media.id,
                            "original_name": item.media.original_name,
                            "file_name": item.media.file_name,
                            "file_path": item.media.file_path,
                            "mime_type": item.media.mime_type,
                            "file_size": item.media.file_size,
                        }
                    }
                    for item in sorted(active_items, key=lambda x: x.sort_order)
                ]
            })

        return result, None