from marshmallow import ValidationError
from flask import Blueprint, request, jsonify
from flask_login import login_required

from app.services.info_service import InfoService
from app.schemas.info_schema import InfoCreateSchema, InfoUpdateSchema

info_bp = Blueprint("infos", __name__, url_prefix="/api/infos")


def serialize_info(info):
    return {
        "id": info.id,
        "title": info.title,
        "slogan": info.slogan,
        "description": info.description,
        "image": info.image,
        "status": info.status,
        "create_at": info.create_at.isoformat() if info.create_at else None,
        "update_at": info.update_at.isoformat() if info.update_at else None,
    }


# =========================
# ADMIN APIs
# =========================

@info_bp.route("", methods=["GET"])
@login_required
def get_infos():
    include_inactive = request.args.get("include_inactive", "false").lower() == "true"
    infos = InfoService.get_all(include_inactive=include_inactive)

    return jsonify({
        "success": True,
        "count": len(infos),
        "infos": [serialize_info(info) for info in infos]
    }), 200


@info_bp.route("/<int:info_id>", methods=["GET"])
@login_required
def get_info_by_id(info_id):
    info = InfoService.get_by_id(info_id)
    if not info:
        return jsonify({
            "success": False,
            "message": "Không tìm thấy item slider"
        }), 404

    return jsonify({
        "success": True,
        "info": serialize_info(info)
    }), 200


@info_bp.route("", methods=["POST"])
@login_required
def create_info():
    form_data = request.form.to_dict()
    image_file = request.files.get("image")

    try:
        data = InfoCreateSchema().load(form_data)
    except ValidationError as err:
        return jsonify({
            "success": False,
            "message": "Dữ liệu không hợp lệ",
            "errors": err.messages
        }), 400

    info, error = InfoService.create_info(data, image_file=image_file)
    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "message": "Tạo item slider thành công",
        "info": serialize_info(info)
    }), 201


@info_bp.route("/<int:info_id>", methods=["PUT"])
@login_required
def update_info(info_id):
    form_data = request.form.to_dict()
    image_file = request.files.get("image")

    try:
        data = InfoUpdateSchema().load(form_data)
    except ValidationError as err:
        return jsonify({
            "success": False,
            "message": "Dữ liệu không hợp lệ",
            "errors": err.messages
        }), 400

    info, error = InfoService.update_info(
        info_id=info_id,
        data=data,
        image_file=image_file
    )
    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 404 if error == "Không tìm thấy item slider" else 400

    return jsonify({
        "success": True,
        "message": "Cập nhật item slider thành công",
        "info": serialize_info(info)
    }), 200


@info_bp.route("/<int:info_id>", methods=["DELETE"])
@login_required
def delete_info(info_id):
    success, error = InfoService.delete_info(info_id)
    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 404

    return jsonify({
        "success": True,
        "message": "Xóa item slider thành công"
    }), 200


# =========================
# PUBLIC API
# =========================

@info_bp.route("/public", methods=["GET"])
def get_public_infos():
    infos = InfoService.get_all(include_inactive=False)

    return jsonify({
        "success": True,
        "count": len(infos),
        "infos": [serialize_info(info) for info in infos]
    }), 200