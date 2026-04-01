from marshmallow import Schema, fields, validates, ValidationError, RAISE


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


def parse_int(value, field_name="id"):
    if value is None or value == "":
        return None

    if isinstance(value, int):
        return value

    if isinstance(value, str):
        value = value.strip()
        if value.isdigit():
            return int(value)

    raise ValidationError(f"{field_name} phải là số nguyên")


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


class BannerFullItemCreateSchema(Schema):
    class Meta:
        unknown = RAISE

    image_key = fields.String(
        required=True,
        error_messages={
            "required": "image_key là bắt buộc",
            "null": "image_key không được để trống",
        },
    )
    url = fields.String(required=False, allow_none=True, load_default=None)
    sort_order = fields.Raw(required=False, load_default=0)
    status = fields.Raw(required=False, load_default=True)

    @validates("image_key")
    def validate_image_key(self, value, **kwargs):
        if not isinstance(value, str) or not value.strip():
            raise ValidationError("image_key không được để trống")

    @validates("sort_order")
    def validate_sort_order(self, value, **kwargs):
        parsed_value = parse_int(value, "sort_order")
        if parsed_value is not None and parsed_value < 0:
            raise ValidationError("sort_order không được nhỏ hơn 0")

    @validates("status")
    def validate_status(self, value, **kwargs):
        parse_bool(value)


class BannerFullCreateSchema(Schema):
    class Meta:
        unknown = RAISE

    status = fields.Raw(required=False, load_default=True)
    items = fields.List(
        fields.Nested(BannerFullItemCreateSchema),
        required=True,
        error_messages={
            "required": "items là bắt buộc",
            "null": "items không được để trống",
        },
    )

    @validates("status")
    def validate_status(self, value, **kwargs):
        parse_bool(value)

    @validates("items")
    def validate_items(self, value, **kwargs):
        if not value or len(value) == 0:
            raise ValidationError("Phải có ít nhất 1 banner item")

        image_keys = []
        for item in value:
            image_key = item.get("image_key")
            if image_key:
                image_keys.append(image_key.strip())

        if len(image_keys) != len(set(image_keys)):
            raise ValidationError("image_key trong items không được trùng nhau")


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


class BannerListPreviewMediaSchema(Schema):
    file_path = fields.String(allow_none=True)


class BannerListPreviewItemSchema(Schema):
    id = fields.Integer()
    media = fields.Method("get_media")

    def get_media(self, obj):
        if not obj.media:
            return None
        return BannerListPreviewMediaSchema().dump(obj.media)


class BannerListResponseSchema(Schema):
    id = fields.Integer()
    status = fields.Boolean()
    create_at = fields.Method("get_create_at")
    items_count = fields.Method("get_items_count")
    active_items_count = fields.Method("get_active_items_count")
    preview_items = fields.Method("get_preview_items")

    def get_create_at(self, obj):
        return obj.create_at.isoformat() if obj.create_at else None

    def get_items_count(self, obj):
        return len(obj.banner_items or [])

    def get_active_items_count(self, obj):
        return len([item for item in (obj.banner_items or []) if item.status])

    def get_preview_items(self, obj):
        preview_items = [
            item for item in (obj.banner_items or [])
            if item.media and item.media.file_path
        ][:1]

        return BannerListPreviewItemSchema(many=True).dump(preview_items)


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
    
class BannerUpdatePreviewMediaSchema(Schema):
    file_path = fields.String(allow_none=True)


class BannerUpdateItemResponseSchema(Schema):
    id = fields.Integer()
    url = fields.String(allow_none=True)
    sort_order = fields.Integer()
    status = fields.Boolean()
    media = fields.Method("get_media")

    def get_media(self, obj):
        if not obj.media:
            return None
        return BannerUpdatePreviewMediaSchema().dump(obj.media)


class BannerUpdateResponseSchema(Schema):
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
        return BannerUpdateItemResponseSchema(many=True).dump(obj.banner_items or [])