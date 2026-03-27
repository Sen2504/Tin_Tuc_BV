from datetime import datetime, timezone, timedelta

from app.extensions import db


VN_TZ = timezone(timedelta(hours=7))


def vn_now():
    return datetime.now(VN_TZ)


class Banner(db.Model):
    __tablename__ = "banner"

    id = db.Column("id_banner", db.Integer, primary_key=True, autoincrement=True)

    status = db.Column(db.Boolean, default=True, nullable=False)

    create_at = db.Column(db.DateTime, default=vn_now)
    update_at = db.Column(db.DateTime, default=vn_now, onupdate=vn_now)

    banner_items = db.relationship(
        "BannerItem",
        back_populates="banner",
        cascade="all, delete-orphan",
        order_by="BannerItem.sort_order.asc()"
    )

    def __repr__(self):
        return f"<Banner {self.id} - {self.title}>"