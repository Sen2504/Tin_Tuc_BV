from sqlalchemy.orm import joinedload

from app.extensions import db
from app.models.banner import Banner
from app.models.banner_item import BannerItem
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
                joinedload(Banner.banner_items).joinedload(BannerItem.media)
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
                joinedload(Banner.banner_items).joinedload(BannerItem.media)
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

            banner = Banner(
                status=status
            )

            db.session.add(banner)
            db.session.commit()
            return banner, None
        except Exception as e:
            db.session.rollback()
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