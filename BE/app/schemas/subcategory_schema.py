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

    raise ValidationError("Giá trị boolean không hợp lệ")


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


class SubCategoryCreateSchema(Schema):
    class Meta:
        unknown = RAISE

    name = fields.String(
        required=True,
        error_messages={
            "required": "Tên danh mục con là bắt buộc",
            "null": "Tên danh mục con không được để trống"
        },
        validate=validate.Length(
            min=1,
            max=255,
            error="Tên danh mục con phải từ 1 đến 255 ký tự"
        )
    )

    description = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(
            max=2000,
            error="Mô tả không được vượt quá 2000 ký tự"
        )
    )

    status = fields.Raw(
        required=False,
        load_default=True
    )

    category_id = fields.Raw(
        required=True,
        error_messages={
            "required": "category_id là bắt buộc",
            "null": "category_id không được để trống"
        }
    )

    @validates("name")
    def validate_name(self, value, **kwargs):
        if not value or not value.strip():
            raise ValidationError("Tên danh mục con không được để trống")

    @validates("status")
    def validate_status(self, value, **kwargs):
        parse_bool(value)

    @validates("category_id")
    def validate_category_id(self, value, **kwargs):
        parsed_value = parse_int(value, "category_id")
        if parsed_value is None:
            raise ValidationError("category_id là bắt buộc")
        if parsed_value <= 0:
            raise ValidationError("category_id phải lớn hơn 0")


class SubCategoryUpdateSchema(Schema):
    class Meta:
        unknown = RAISE

    name = fields.String(
        required=False,
        validate=validate.Length(
            min=1,
            max=255,
            error="Tên danh mục con phải từ 1 đến 255 ký tự"
        )
    )

    description = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(
            max=2000,
            error="Mô tả không được vượt quá 2000 ký tự"
        )
    )

    status = fields.Raw(required=False)
    category_id = fields.Raw(required=False)
    remove_thumbnail = fields.Raw(required=False, load_default=False)

    @validates("name")
    def validate_name(self, value, **kwargs):
        if value is not None and not value.strip():
            raise ValidationError("Tên danh mục con không được để trống")

    @validates("status")
    def validate_status(self, value, **kwargs):
        parse_bool(value)

    @validates("category_id")
    def validate_category_id(self, value, **kwargs):
        parsed_value = parse_int(value, "category_id")
        if parsed_value is not None and parsed_value <= 0:
            raise ValidationError("category_id phải lớn hơn 0")

    @validates("remove_thumbnail")
    def validate_remove_thumbnail(self, value, **kwargs):
        parse_bool(value)


class MediaResponseSchema(Schema):
    id = fields.Integer()
    original_name = fields.String(allow_none=True)
    file_name = fields.String(allow_none=True)
    file_path = fields.String(allow_none=True)
    mime_type = fields.String(allow_none=True)
    file_size = fields.Integer(allow_none=True)
    caption = fields.String(allow_none=True)


class SubCategoryResponseSchema(Schema):
    id = fields.Integer()
    name = fields.String()
    slug = fields.String()
    description = fields.String(allow_none=True)
    status = fields.Boolean()
    category_id = fields.Integer()
    category_name = fields.Method("get_category_name")
    posts_count = fields.Method("get_posts_count")
    thumbnail_media_id = fields.Integer(allow_none=True)
    thumbnail = fields.Method("get_thumbnail")

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_thumbnail(self, obj):
        if not obj.thumbnail_media:
            return None
        return MediaResponseSchema().dump(obj.thumbnail_media)

    def get_posts_count(self, obj):
        return len(obj.posts or [])


class SubCategorySimpleResponseSchema(Schema):
    id = fields.Integer()
    name = fields.String()
    slug = fields.String()
    description = fields.String(allow_none=True)
    status = fields.Boolean()
    category_id = fields.Integer()
    thumbnail_media_id = fields.Integer(allow_none=True)