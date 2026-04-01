from marshmallow import ValidationError
from flask import Blueprint, request, jsonify
from flask_login import login_required

from app.services.info_service import InfoService

from app.schemas.info_schema import (
    InfoCreateSchema,
    InfoUpdateSchema,
    InfoStatusUpdateSchema,
    InfoResponseSchema,
    InfoListResponseSchema,
    InfoStatusResponseSchema,
    InfoCreateResponseSchema,
    InfoUpdateResponseSchema,
)

info_bp = Blueprint("infos", __name__, url_prefix="/api/infos")

info_create_schema = InfoCreateSchema()
info_update_schema = InfoUpdateSchema()
info_status_update_schema = InfoStatusUpdateSchema()

info_response_schema = InfoResponseSchema()
info_list_response_schema = InfoListResponseSchema(many=True)
info_status_response_schema = InfoStatusResponseSchema()
info_create_response_schema = InfoCreateResponseSchema()
info_update_response_schema = InfoUpdateResponseSchema()



# =========================
# ADMIN APIs
# =========================

@info_bp.route("/list", methods=["GET"])
@login_required
def get_infos_list():
    include_inactive = request.args.get("include_inactive", "false").lower() == "true"
    infos = InfoService.get_all_for_list(include_inactive=include_inactive)

    return jsonify({
        "count": len(infos),
        "infos": info_list_response_schema.dump(infos)
    }), 200


@info_bp.route("/<int:info_id>", methods=["GET"])
@login_required
def get_info_by_id(info_id):
    info = InfoService.get_by_id(info_id)
    if not info:
        return jsonify({
            "message": "Không tìm thấy info"
        }), 404

    return jsonify({
        "info": info_response_schema.dump(info)
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
            "message": "Dữ liệu không hợp lệ",
            "errors": err.messages
        }), 400

    info, error = InfoService.create_info(data, image_file=image_file)
    if error:
        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Tạo info thành công",
        "info": info_create_response_schema.dump(info)
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
            "message": error
        }), 404 if error == "Không tìm thấy item slider" else 400

    return jsonify({
        "message": "Cập nhật info thành công",
        "info": info_update_response_schema.dump(info)
    }), 200


@info_bp.route("/<int:info_id>", methods=["DELETE"])
@login_required
def delete_info(info_id):
    error = InfoService.delete_info(info_id)
    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Xóa info thành công"
    }), 200


# =========================
# PUBLIC API
# =========================

@info_bp.route("/public", methods=["GET"])
def get_public_infos():
    infos = InfoService.get_all(include_inactive=False)

    return jsonify({
        "count": len(infos),
        "infos": info_response_schema.dump(infos, many=True)
    }), 200

@info_bp.route("/<int:info_id>/status", methods=["PATCH"])
@login_required
def update_info_status(info_id):
    json_data = request.get_json(silent=True) or {}

    try:
        data = info_status_update_schema.load(json_data)
    except ValidationError as err:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": err.messages
        }), 400

    info, error = InfoService.update_info_status(info_id, data["status"])
    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Cập nhật trạng thái info thành công",
        "info": info_status_response_schema.dump(info)
    }), 200