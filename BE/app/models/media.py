from datetime import datetime, timezone, timedelta
from app.extensions import db

VN_TZ = timezone(timedelta(hours=7))

def vn_now():
    return datetime.now(VN_TZ)


class Media(db.Model):
    __tablename__ = "media"

    id = db.Column("id_media", db.Integer, primary_key=True, autoincrement=True)

    original_name = db.Column(db.String(500), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)

    file_path = db.Column(db.String(500), nullable=False)

    mime_type = db.Column(db.String(100))

    file_size = db.Column(db.BigInteger)

    upload_at = db.Column(db.DateTime, default=vn_now)

    caption = db.Column(db.String(500))

    post_links = db.relationship(
        "PostMedia",
        back_populates="media",
        cascade="all, delete-orphan"
    )