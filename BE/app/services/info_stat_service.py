from app.extensions import db
from app.models.info import Info
from app.models.info_stat import InfoStat
from app.schemas.info_schema import parse_bool


class InfoStatService:
    @staticmethod
    def get_all_by_info_id(info_id, include_inactive=True):
        query = InfoStat.query.filter(InfoStat.info_id == info_id).order_by(InfoStat.id.asc())

        if not include_inactive:
            query = query.filter(InfoStat.status.is_(True))

        return query.all()

    @staticmethod
    def get_by_id(stat_id):
        return InfoStat.query.filter(InfoStat.id == stat_id).first()

    @staticmethod
    def create_info_stat(data):
        info = Info.query.filter(Info.id == data["info_id"]).first()
        if not info:
            return None, "Không tìm thấy info cha"

        stat = InfoStat(
            value=data["value"].strip(),
            label=data["label"].strip(),
            status=parse_bool(data.get("status", True)),
            info_id=data["info_id"]
        )

        db.session.add(stat)
        db.session.commit()
        return stat, None

    @staticmethod
    def update_info_stat(stat_id, data):
        stat = InfoStat.query.filter(InfoStat.id == stat_id).first()
        if not stat:
            return None, "Không tìm thấy info_stat"

        if "info_id" in data:
            info = Info.query.filter(Info.id == data["info_id"]).first()
            if not info:
                return None, "Không tìm thấy info cha"
            stat.info_id = data["info_id"]

        if "value" in data:
            stat.value = data["value"].strip()

        if "label" in data:
            stat.label = data["label"].strip()

        if "status" in data:
            stat.status = parse_bool(data["status"])

        db.session.commit()
        return stat, None

    @staticmethod
    def delete_info_stat(stat_id):
        stat = InfoStat.query.filter(InfoStat.id == stat_id).first()
        if not stat:
            return False, "Không tìm thấy info_stat"

        db.session.delete(stat)
        db.session.commit()
        return True, None