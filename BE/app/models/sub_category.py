from datetime import datetime, timezone, timedelta
from app.extensions import db

VN_TZ = timezone(timedelta(hours=7))

def vn_now():
    return datetime.now(VN_TZ)



class SubCategory(db.Model):
    __tablename__ = "sub_category"

    id = db.Column("id_subcategory", db.Integer, primary_key=True, autoincrement=True)

    name = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False)
    description = db.Column(db.Text)

    status = db.Column(db.Boolean, default=True)

    create_at = db.Column(db.DateTime, default=vn_now)
    update_at = db.Column(db.DateTime, default=vn_now, onupdate=vn_now)

    category_id = db.Column(
        db.Integer,
        db.ForeignKey("category.id_category"),
        nullable=False
    )

    thumbnail_media_id = db.Column(
        db.Integer,
        db.ForeignKey("media.id_media", ondelete="SET NULL"),
        nullable=True
    )

    category = db.relationship(
        "Category",
        back_populates="subcategories"
    )

    posts = db.relationship(
        "Post",
        back_populates="subcategory",
        cascade="all, delete"
    )

    thumbnail_media = db.relationship(
        "Media",
        foreign_keys=[thumbnail_media_id],
        lazy="joined"
    )