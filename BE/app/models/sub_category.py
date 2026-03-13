from datetime import datetime
from app.extensions import db


class SubCategory(db.Model):
    __tablename__ = "sub_category"

    id = db.Column("id_subcategory", db.Integer, primary_key=True, autoincrement=True)

    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)

    status = db.Column(db.Boolean, default=True)

    create_at = db.Column(db.DateTime, default=datetime.utcnow)
    update_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category_id = db.Column(
        db.Integer,
        db.ForeignKey("category.id_category"),
        nullable=False
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