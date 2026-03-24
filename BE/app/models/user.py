from datetime import datetime, timezone, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from app.extensions import db

VN_TZ = timezone(timedelta(hours=7))

def vn_now():
    return datetime.now(VN_TZ)



class User(db.Model, UserMixin):
    __tablename__ = "users"

    ROLE_ADMIN = "admin"
    ROLE_STAFF = "staff"

    id = db.Column("id_user", db.Integer, primary_key=True, autoincrement=True)

    username = db.Column("user_name", db.String(256), nullable=False, unique=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password_hash = db.Column("password", db.String(255), nullable=False)

    role = db.Column(db.String(20), nullable=False, default=ROLE_ADMIN)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    confirmed = db.Column(db.Boolean, nullable=False, default=False)
    confirmed_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=vn_now)

    posts = db.relationship(
        "Post",
        back_populates="author",
        cascade="all, delete-orphan"
    )

    def set_password(self, raw_password: str):
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password_hash(self.password_hash, raw_password)

    def is_admin(self) -> bool:
        return self.role == self.ROLE_ADMIN