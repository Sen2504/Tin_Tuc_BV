from marshmallow import Schema, fields, validate, validates, ValidationError, EXCLUDE, RAISE
import re

def parse_bool(value):
    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        value = value.strip().lower()
        if value in {"true", "1", "yes", "on"}:
            return True
        if value in {"false", "0", "no", "off"}:
            return False

    if isinstance(value, int):
        return bool(value)

    raise ValidationError("status must be a boolean")

def validate_category_name_rule(value):
    normalized_value = " ".join(value.strip().split())

    if not normalized_value:
        raise ValidationError("Tên category không được để trống")

    pattern = r"^[A-Za-zÀ-ỹ][A-Za-zÀ-ỹ0-9 ]*$"
    if not re.match(pattern, normalized_value):
        raise ValidationError(
            "Tên category phải bắt đầu bằng chữ, không được chứa ký tự đặc biệt và chỉ được chứa số ở phía sau"
        )


class CategoryCreateSchema(Schema):
    class Meta:
        unknown = RAISE

    name = fields.String(
        required=True,
        error_messages={
            "required": "Tên category là bắt buộc",
            "null": "Tên category không được để trống"
        },
        validate=validate.Length(
            min=1,
            max=255,
            error="Tên category phải từ 1 đến 255 ký tự"
        )
    )

    description = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(
            max=1000,
            error="Mô tả không được vượt quá 1000 ký tự"
        )
    )

    status = fields.Raw(
        required=False,
        load_default=True
    )

    @validates("name")
    def validate_name_not_blank(self, value, **kwargs):
        validate_category_name_rule(value)

    @validates("status")
    def validate_status(self, value, **kwargs):
        parse_bool(value)


class CategoryUpdateSchema(Schema):
    class Meta:
        unknown = RAISE

    name = fields.String(
        required=False,
        validate=validate.Length(
            min=1,
            max=255,
            error="Tên category phải từ 1 đến 255 ký tự"
        )
    )

    description = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(
            max=1000,
            error="Mô tả không được vượt quá 1000 ký tự"
        )
    )

    status = fields.Raw(required=False)

    @validates("name")
    def validate_name_not_blank(self, value, **kwargs):
        if value is not None:
            validate_category_name_rule(value)


    @validates("status")
    def validate_status(self, value, **kwargs):
        parse_bool(value)

class ThumbnailResponseSchema(Schema):
    id = fields.Integer()
    file_path = fields.String()
    file_name = fields.String()
    original_name = fields.String()


class SubcategorySimpleResponseSchema(Schema):
    id = fields.Integer()
    name = fields.String()
    slug = fields.String()


class SubcategoryResponseSchema(Schema):
    id = fields.Integer()
    name = fields.String()
    slug = fields.String()
    description = fields.String(allow_none=True)
    status = fields.Boolean()
    thumbnail_media_id = fields.Integer(allow_none=True)
    thumbnail = fields.Nested(
        ThumbnailResponseSchema,
        attribute="thumbnail_media",
        allow_none=True
    )


class CategoryResponseSchema(Schema):
    id = fields.Integer()
    name = fields.String()
    slug = fields.String()
    description = fields.String(allow_none=True)
    status = fields.Boolean()
    subcategories = fields.List(fields.Nested(SubcategoryResponseSchema))


class CategorySimpleResponseSchema(Schema):
    id = fields.Integer()
    name = fields.String()
    slug = fields.String()
    description = fields.String(allow_none=True)
    status = fields.Boolean()