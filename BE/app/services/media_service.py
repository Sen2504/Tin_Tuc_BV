import os
import uuid

from flask import current_app, url_for
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models.media import Media


class MediaService:
    ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}

    @staticmethod
    def _allowed_image(filename: str) -> bool:
        if "." not in filename:
            return False
        ext = filename.rsplit(".", 1)[1].lower()
        return ext in MediaService.ALLOWED_IMAGE_EXTENSIONS

    @staticmethod
    def upload_editor_image(file_storage):
        if not file_storage:
            return None, "Thiếu file upload"

        if not file_storage.filename:
            return None, "Tên file không hợp lệ"

        if not MediaService._allowed_image(file_storage.filename):
            return None, "Chỉ cho phép upload ảnh jpg, jpeg, png, webp, gif"

        base_upload_folder = current_app.config["UPLOAD_FOLDER"]
        upload_folder = os.path.join(base_upload_folder, "post")
        os.makedirs(upload_folder, exist_ok=True)

        original_name = file_storage.filename
        safe_name = secure_filename(original_name)
        _, ext = os.path.splitext(safe_name)
        file_name = f"{uuid.uuid4().hex}{ext.lower()}"

        abs_path = os.path.join(upload_folder, file_name)

        try:
            file_storage.save(abs_path)
            file_size = os.path.getsize(abs_path)

            media = Media(
                original_name=original_name,
                file_name=file_name,
                file_path = f"post/{file_name}",
                mime_type=file_storage.mimetype,
                file_size=file_size,
            )

            db.session.add(media)
            db.session.commit()

            relative_path = f"post/{file_name}"
            file_url = url_for("media.get_uploaded_file", filename=relative_path, _external=True)

            return {
                "media_id": media.id,
                "location": file_url,
                "file_name": media.file_name,
            }, None

        except Exception:
            db.session.rollback()

            if os.path.exists(abs_path):
                os.remove(abs_path)

            return None, "Upload ảnh thất bại"