from datetime import datetime, timezone, timedelta
from app.extensions import db

VN_TZ = timezone(timedelta(hours=7))

def vn_now():
    return datetime.now(VN_TZ)



class Category(db.Model):
    __tablename__ = "category"

    id = db.Column("id_category", db.Integer, primary_key=True, autoincrement=True)

    name = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False)
    description = db.Column(db.Text)

    status = db.Column(db.Boolean, default=True)

    create_at = db.Column(db.DateTime, default=vn_now)
    update_at = db.Column(db.DateTime, default=vn_now, onupdate=vn_now)

    subcategories = db.relationship(
        "SubCategory",
        back_populates="category",
        cascade="all, delete"
    )