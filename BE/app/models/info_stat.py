from datetime import datetime
from app.extensions import db


class InfoStat(db.Model):
    __tablename__ = "info_stat"

    id = db.Column("id_stat", db.Integer, primary_key=True, autoincrement=True)

    value = db.Column(db.String(50), nullable=False)
    label = db.Column(db.String(55), nullable=False)
    status = db.Column(db.Boolean, default=True, nullable=False)

    create_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    update_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # khóa ngoại trỏ về bảng info
    info_id = db.Column(
        db.Integer,
        db.ForeignKey("info.id_info"),
        nullable=False
    )

    info = db.relationship(
        "Info",
        back_populates="info_stats"
    )

    def __repr__(self):
        return f"<InfoStat id={self.id} label='{self.label}'>"