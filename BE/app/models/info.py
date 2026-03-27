from datetime import datetime
from app.extensions import db


class Info(db.Model):
    __tablename__ = "info"

    id = db.Column("id_info", db.Integer, primary_key=True, autoincrement=True)

    title = db.Column(db.String(256), nullable=False)
    slogan = db.Column(db.String(300))
    description = db.Column(db.Text)
    image = db.Column(db.String(500))
    status = db.Column(db.Boolean, default=True, nullable=False)

    create_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    update_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # 1 info có nhiều info_stat
    info_stats = db.relationship(
        "InfoStat",
        back_populates="info",
        cascade="all, delete-orphan",
        lazy=True
    )

    def __repr__(self):
        return f"<Info id={self.id} title='{self.title}'>"