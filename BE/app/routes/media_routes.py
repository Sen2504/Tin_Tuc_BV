import os

from flask import Blueprint, jsonify, request, current_app, send_from_directory
from flask_login import login_required

from app.services.media_service import MediaService

media_bp = Blueprint("media", __name__, url_prefix="/api/media")


@media_bp.route("/upload", methods=["POST"])
@login_required
def upload_media():
    file = request.files.get("file")

    result, error = MediaService.upload_editor_image(file)
    if error:
        return jsonify({"error": error}), 400

    return jsonify(result), 201


@media_bp.route("/files/<path:filename>", methods=["GET"])
def get_uploaded_file(filename):
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    return send_from_directory(upload_folder, filename)