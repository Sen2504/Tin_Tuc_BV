from datetime import datetime
from app.extensions import db


class PostMedia(db.Model):
    __tablename__ = "post_media"

    id = db.Column("id_pm", db.Integer, primary_key=True, autoincrement=True)

    post_id = db.Column(
        db.Integer,
        db.ForeignKey("post.id_post"),
        nullable=False
    )

    media_id = db.Column(
        db.Integer,
        db.ForeignKey("media.id_media"),
        nullable=False
    )

    post = db.relationship("Post", back_populates="media_links")
    media = db.relationship("Media", back_populates="post_links")