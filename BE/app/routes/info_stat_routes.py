from marshmallow import ValidationError
from flask import Blueprint, request, jsonify
from flask_login import login_required

from app.services.info_stat_service import InfoStatService
from app.schemas.info_stat_schema import ( 
    InfoStatCreateSchema,
    InfoStatUpdateSchema,
    InfoStatCreateResponseSchema, 
    InfoStatUpdateResponseSchema,
    InfoStatResponseSchema,
    InfoStatUIResponseSchema
)

info_stat_bp = Blueprint("info_stats", __name__, url_prefix="/api/info-stats")

info_stat_create_response_schema = InfoStatCreateResponseSchema()
info_stat_update_response_schema = InfoStatUpdateResponseSchema()
info_stat_response_schema = InfoStatResponseSchema()
info_stat_ui_response_schema = InfoStatUIResponseSchema()

# def serialize_info_stat(stat):
#     return {
#         "id": stat.id,
#         "value": stat.value,
#         "label": stat.label,
#         "status": stat.status,
#         "create_at": stat.create_at.isoformat() if stat.create_at else None,
#         "update_at": stat.update_at.isoformat() if stat.update_at else None,
#         "info_id": stat.info_id,
#     }


# =========================
# ADMIN APIs
# =========================

@info_stat_bp.route("", methods=["GET"])
@login_required
def get_info_stats():
    info_id = request.args.get("info_id", type=int)
    include_inactive = request.args.get("include_inactive", "true").lower() == "true"

    if not info_id:
        return jsonify({
            "message": "Thiếu info_id"
        }), 400

    stats = InfoStatService.get_all_by_info_id(
        info_id=info_id,
        include_inactive=include_inactive
    )

    return jsonify({
        "count": len(stats),
        "info_stats": info_stat_response_schema.dump(stats, many=True)
    }), 200


@info_stat_bp.route("/<int:stat_id>", methods=["GET"])
@login_required
def get_info_stat_by_id(stat_id):
    stat = InfoStatService.get_by_id(stat_id)
    if not stat:
        return jsonify({
            "message": "Không tìm thấy info_stat"
        }), 404

    return jsonify({
        "info_stat": info_stat_response_schema.dump(stat)
    }), 200


@info_stat_bp.route("", methods=["POST"])
@login_required
def create_info_stat():
    json_data = request.get_json(silent=True) or {}

    try:
        data = InfoStatCreateSchema().load(json_data)
    except ValidationError as err:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": err.messages
        }), 400

    stat, error = InfoStatService.create_info_stat(data)
    if error:
        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Tạo info_stat thành công",
        "info_stat": info_stat_create_response_schema.dump(stat)
    }), 201


@info_stat_bp.route("/<int:stat_id>", methods=["PUT"])
@login_required
def update_info_stat(stat_id):
    json_data = request.get_json(silent=True) or {}

    try:
        data = InfoStatUpdateSchema().load(json_data)
    except ValidationError as err:
        return jsonify({
            "message": "Dữ liệu không hợp lệ",
            "errors": err.messages
        }), 400

    stat, error = InfoStatService.update_info_stat(stat_id, data)
    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Cập nhật info_stat thành công",
        "info_stat": info_stat_update_response_schema.dump(stat)
    }), 200


@info_stat_bp.route("/<int:stat_id>", methods=["DELETE"])
@login_required
def delete_info_stat(stat_id):
    error = InfoStatService.delete_info_stat(stat_id)
    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Xóa info_stat thành công"
    }), 200


# =========================
# PUBLIC API
# =========================

@info_stat_bp.route("/public", methods=["GET"])
def get_public_info_stats():
    info_id = request.args.get("info_id", type=int)

    if not info_id:
        return jsonify({
            "message": "Thiếu info_id"
        }), 400

    stats = InfoStatService.get_all_by_info_id(
        info_id=info_id,
        include_inactive=False
    )

    return jsonify({
        "count": len(stats),
        "info_stats": info_stat_ui_response_schema.dump(stats, many=True)
    }), 200