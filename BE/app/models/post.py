from datetime import datetime, timezone, timedelta
from app.extensions import db

VN_TZ = timezone(timedelta(hours=7))

def vn_now():
    return datetime.now(VN_TZ)



class Post(db.Model):
    __tablename__ = "post"

    id = db.Column("id_post", db.Integer, primary_key=True, autoincrement=True)

    title = db.Column(db.String(256), nullable=False)
    slug = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)

    status = db.Column(db.Boolean, default=True)

    hashtag = db.Column(db.String(100))

    create_at = db.Column(db.DateTime, default=vn_now)
    update_at = db.Column(db.DateTime, default=vn_now, onupdate=vn_now)

    # FK tới subcategory
    subcategory_id = db.Column(
        db.Integer,
        db.ForeignKey("sub_category.id_subcategory"),
        nullable=False
    )

    subcategory = db.relationship(
        "SubCategory",
        back_populates="posts"
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id_user"),
        nullable=False
    )

    author = db.relationship("User", back_populates="posts")

    media_links = db.relationship(
        "PostMedia",
        back_populates="post",
        cascade="all, delete-orphan"
    )