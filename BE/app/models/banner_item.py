from datetime import datetime, timezone, timedelta

from app.extensions import db


VN_TZ = timezone(timedelta(hours=7))


def vn_now():
    return datetime.now(VN_TZ)


class BannerItem(db.Model):
    __tablename__ = "banner_item"

    id = db.Column("id_item", db.Integer, primary_key=True, autoincrement=True)

    url = db.Column(db.Text)
    sort_order = db.Column(db.Integer, default=0, nullable=False)
    status = db.Column(db.Boolean, default=True, nullable=False)
    
    create_at = db.Column(db.DateTime, default=vn_now)
    update_at = db.Column(db.DateTime, default=vn_now, onupdate=vn_now)

    banner_id = db.Column(
        db.Integer,
        db.ForeignKey("banner.id_banner", ondelete="CASCADE"),
        nullable=False
    )

    media_id = db.Column(
        db.Integer,
        db.ForeignKey("media.id_media", ondelete="SET NULL"),
        nullable=True
    )

    banner = db.relationship(
        "Banner",
        back_populates="banner_items"
    )

    media = db.relationship(
        "Media",
        back_populates="banner_items"
    )

    def __repr__(self):
        return f"<BannerItem {self.id} - banner_id={self.banner_id}>"