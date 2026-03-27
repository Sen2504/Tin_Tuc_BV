from marshmallow import Schema, fields, validate, validates, ValidationError, RAISE


def parse_bool(value):
    if value is None or value == "":
        return None

    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        value = value.strip().lower()
        if value in {"true", "1", "yes", "on", "active"}:
            return True
        if value in {"false", "0", "no", "off", "inactive"}:
            return False

    if isinstance(value, int):
        return bool(value)

    raise ValidationError("status phải là boolean hợp lệ")


class BannerCreateSchema(Schema):
    class Meta:
        unknown = RAISE

    status = fields.Raw(required=False, load_default=True)

    @validates("status")
    def validate_status(self, value, **kwargs):
        parse_bool(value)


class BannerUpdateSchema(Schema):
    class Meta:
        unknown = RAISE

    status = fields.Raw(required=False)

    @validates("status")
    def validate_status(self, value, **kwargs):
        parse_bool(value)


class BannerItemMediaResponseSchema(Schema):
    id = fields.Integer()
    original_name = fields.String(allow_none=True)
    file_name = fields.String(allow_none=True)
    file_path = fields.String(allow_none=True)
    mime_type = fields.String(allow_none=True)
    file_size = fields.Integer(allow_none=True)


class BannerItemResponseSchema(Schema):
    id = fields.Integer()
    banner_id = fields.Integer()
    url = fields.String(allow_none=True)
    sort_order = fields.Integer()
    status = fields.Boolean()
    create_at = fields.Method("get_create_at")
    update_at = fields.Method("get_update_at")
    media = fields.Method("get_media")

    def get_create_at(self, obj):
        return obj.create_at.isoformat() if obj.create_at else None

    def get_update_at(self, obj):
        return obj.update_at.isoformat() if obj.update_at else None

    def get_media(self, obj):
        if not obj.media:
            return None
        return BannerItemMediaResponseSchema().dump(obj.media)


class BannerResponseSchema(Schema):
    id = fields.Integer()
    status = fields.Boolean()
    create_at = fields.Method("get_create_at")
    update_at = fields.Method("get_update_at")
    banner_items = fields.Method("get_banner_items")

    def get_create_at(self, obj):
        return obj.create_at.isoformat() if obj.create_at else None

    def get_update_at(self, obj):
        return obj.update_at.isoformat() if obj.update_at else None

    def get_banner_items(self, obj):
        return BannerItemResponseSchema(many=True).dump(obj.banner_items or [])