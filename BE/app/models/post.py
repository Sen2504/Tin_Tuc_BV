from datetime import datetime
from app.extensions import db


class Post(db.Model):
    __tablename__ = "post"

    id = db.Column("id_post", db.Integer, primary_key=True, autoincrement=True)

    title = db.Column(db.String(256), nullable=False)
    content = db.Column(db.Text, nullable=False)

    status = db.Column(db.Boolean, default=True)

    hashtag = db.Column(db.String(100))

    create_at = db.Column(db.DateTime, default=datetime.utcnow)
    update_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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