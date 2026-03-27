from marshmallow import Schema, fields, validate, validates, ValidationError, RAISE
from app.schemas.info_schema import parse_bool


class InfoStatCreateSchema(Schema):
    class Meta:
        unknown = RAISE

    value = fields.String(
        required=True,
        error_messages={
            "required": "Value là bắt buộc",
            "null": "Value không được để trống"
        },
        validate=validate.Length(
            min=1,
            max=50,
            error="Value phải từ 1 đến 50 ký tự"
        )
    )

    label = fields.String(
        required=True,
        error_messages={
            "required": "Label là bắt buộc",
            "null": "Label không được để trống"
        },
        validate=validate.Length(
            min=1,
            max=55,
            error="Label phải từ 1 đến 55 ký tự"
        )
    )

    status = fields.Raw(required=False, load_default=True)

    info_id = fields.Integer(
        required=True,
        error_messages={
            "required": "info_id là bắt buộc",
            "null": "info_id không được để trống"
        }
    )

    @validates("value")
    def validate_value_not_blank(self, value, **kwargs):
        if not value or not value.strip():
            raise ValidationError("Value không được để trống")

    @validates("label")
    def validate_label_not_blank(self, value, **kwargs):
        if not value or not value.strip():
            raise ValidationError("Label không được để trống")

    @validates("status")
    def validate_status(self, value, **kwargs):
        parse_bool(value)


class InfoStatUpdateSchema(Schema):
    class Meta:
        unknown = RAISE

    value = fields.String(
        required=False,
        validate=validate.Length(
            min=1,
            max=50,
            error="Value phải từ 1 đến 50 ký tự"
        )
    )

    label = fields.String(
        required=False,
        validate=validate.Length(
            min=1,
            max=55,
            error="Label phải từ 1 đến 55 ký tự"
        )
    )

    status = fields.Raw(required=False)

    info_id = fields.Integer(required=False)

    @validates("value")
    def validate_value_not_blank(self, value, **kwargs):
        if value is not None and not value.strip():
            raise ValidationError("Value không được để trống")

    @validates("label")
    def validate_label_not_blank(self, value, **kwargs):
        if value is not None and not value.strip():
            raise ValidationError("Label không được để trống")

    @validates("status")
    def validate_status(self, value, **kwargs):
        parse_bool(value)