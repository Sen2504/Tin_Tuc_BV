from marshmallow import Schema, fields, validate, validates, ValidationError, RAISE


def parse_bool(value):
    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        v = value.strip().lower()
        if v in {"true", "1", "yes", "on", "active"}:
            return True
        if v in {"false", "0", "no", "off", "inactive"}:
            return False

    if isinstance(value, int):
        if value == 1:
            return True
        if value == 0:
            return False

    raise ValidationError("Giá trị boolean không hợp lệ")


class InfoCreateSchema(Schema):
    class Meta:
        unknown = RAISE

    title = fields.String(
        required=True,
        error_messages={
            "required": "Tiêu đề là bắt buộc",
            "null": "Tiêu đề không được để trống"
        },
        validate=validate.Length(
            min=1,
            max=256,
            error="Tiêu đề phải từ 1 đến 256 ký tự"
        )
    )

    slogan = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(
            max=300,
            error="Slogan không được vượt quá 300 ký tự"
        )
    )

    description = fields.String(
        required=False,
        allow_none=True
    )

    status = fields.Raw(
        required=False,
        load_default=True
    )

    @validates("title")
    def validate_title_not_blank(self, value, **kwargs):
        if not value or not value.strip():
            raise ValidationError("Tiêu đề không được để trống")

    @validates("status")
    def validate_status(self, value, **kwargs):
        parse_bool(value)


class InfoUpdateSchema(Schema):
    class Meta:
        unknown = RAISE

    title = fields.String(
        required=False,
        validate=validate.Length(
            min=1,
            max=256,
            error="Tiêu đề phải từ 1 đến 256 ký tự"
        )
    )

    slogan = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(
            max=300,
            error="Slogan không được vượt quá 300 ký tự"
        )
    )

    description = fields.String(
        required=False,
        allow_none=True
    )

    status = fields.Raw(required=False)

    remove_image = fields.Raw(required=False, load_default=False)

    @validates("title")
    def validate_title_not_blank(self, value, **kwargs):
        if value is not None and not value.strip():
            raise ValidationError("Tiêu đề không được để trống")

    @validates("status")
    def validate_status(self, value, **kwargs):
        parse_bool(value)

    @validates("remove_image")
    def validate_remove_image(self, value, **kwargs):
        parse_bool(value)