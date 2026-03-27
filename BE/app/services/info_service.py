import os
import uuid

from flask import current_app
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models.info import Info
from app.schemas.info_schema import parse_bool


class InfoService:
    ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}

    @staticmethod
    def _allowed_image(filename: str) -> bool:
        if not filename or "." not in filename:
            return False

        ext = filename.rsplit(".", 1)[1].lower()
        return ext in InfoService.ALLOWED_IMAGE_EXTENSIONS

    @staticmethod
    def _save_image_file(file_storage):
        if not file_storage:
            return None, None

        if not file_storage.filename:
            return None, "Tên file ảnh không hợp lệ"

        if not InfoService._allowed_image(file_storage.filename):
            return None, "Chỉ cho phép upload ảnh jpg, jpeg, png, webp, gif"

        base_upload_folder = current_app.config["UPLOAD_FOLDER"]
        upload_folder = os.path.join(base_upload_folder, "info")
        os.makedirs(upload_folder, exist_ok=True)

        original_name = file_storage.filename
        safe_name = secure_filename(original_name)

        ext = ""
        if "." in safe_name:
            ext = "." + safe_name.rsplit(".", 1)[1].lower()

        unique_name = f"{uuid.uuid4().hex}{ext}"
        absolute_path = os.path.join(upload_folder, unique_name)

        file_storage.save(absolute_path)

        relative_path = f"/uploads/info/{unique_name}"
        return relative_path, None

    @staticmethod
    def _delete_physical_file(relative_path: str):
        if not relative_path:
            return

        cleaned_path = relative_path.lstrip("/\\")
        base_upload_folder = current_app.config["UPLOAD_FOLDER"]
        absolute_path = os.path.join(base_upload_folder, cleaned_path.replace("uploads/", "", 1))

        if os.path.isfile(absolute_path):
            os.remove(absolute_path)

    @staticmethod
    def get_all(include_inactive=False):
        query = Info.query.order_by(Info.id.asc())

        if not include_inactive:
            query = query.filter(Info.status.is_(True))

        return query.all()

    @staticmethod
    def get_by_id(info_id):
        return Info.query.filter(Info.id == info_id).first()

    @staticmethod
    def create_info(data, image_file=None):
        image_path = None

        if image_file:
            image_path, error = InfoService._save_image_file(image_file)
            if error:
                return None, error

        info = Info(
            title=data["title"].strip(),
            slogan=data.get("slogan").strip() if isinstance(data.get("slogan"), str) else data.get("slogan"),
            description=data.get("description"),
            image=image_path,
            status=parse_bool(data.get("status", True))
        )

        db.session.add(info)
        db.session.commit()
        return info, None

    @staticmethod
    def update_info(info_id, data, image_file=None):
        info = Info.query.filter(Info.id == info_id).first()
        if not info:
            return None, "Không tìm thấy item slider"

        old_image_path = info.image
        remove_image = parse_bool(data.get("remove_image", False)) if "remove_image" in data else False

        if "title" in data:
            info.title = data["title"].strip()

        if "slogan" in data:
            slogan = data.get("slogan")
            info.slogan = slogan.strip() if isinstance(slogan, str) else slogan

        if "description" in data:
            info.description = data.get("description")

        if "status" in data:
            info.status = parse_bool(data["status"])

        new_image_path = None

        if image_file:
            new_image_path, error = InfoService._save_image_file(image_file)
            if error:
                return None, error

            info.image = new_image_path

        elif remove_image:
            info.image = None

        db.session.commit()

        if image_file and old_image_path and old_image_path != new_image_path:
            InfoService._delete_physical_file(old_image_path)

        if remove_image and old_image_path:
            InfoService._delete_physical_file(old_image_path)

        return info, None

    @staticmethod
    def delete_info(info_id):
        info = Info.query.filter(Info.id == info_id).first()
        if not info:
            return False, "Không tìm thấy item slider"

        old_image_path = info.image

        db.session.delete(info)
        db.session.commit()

        if old_image_path:
            InfoService._delete_physical_file(old_image_path)

        return True, None