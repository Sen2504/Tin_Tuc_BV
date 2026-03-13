from datetime import datetime
from app.extensions import db


class Category(db.Model):
    __tablename__ = "category"

    id = db.Column("id_category", db.Integer, primary_key=True, autoincrement=True)

    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)

    status = db.Column(db.Boolean, default=True)

    create_at = db.Column(db.DateTime, default=datetime.utcnow)
    update_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subcategories = db.relationship(
        "SubCategory",
        back_populates="category",
        cascade="all, delete"
    )