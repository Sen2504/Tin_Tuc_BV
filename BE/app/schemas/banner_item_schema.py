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


class BannerItemCreateSchema(Schema):
    class Meta:
        unknown = RAISE

    banner_id = fields.Raw(
        required=True,
        error_messages={
            "required": "banner_id là bắt buộc",
            "null": "banner_id không được để trống"
        }
    )

    url = fields.String(required=False, allow_none=True)
    sort_order = fields.Raw(required=False, load_default=0)
    status = fields.Raw(required=False, load_default=True)

    @validates("banner_id")
    def validate_banner_id(self, value, **kwargs):
        parsed_value = parse_int(value, "banner_id")
        if parsed_value is None:
            raise ValidationError("banner_id là bắt buộc")
        if parsed_value <= 0:
            raise ValidationError("banner_id phải lớn hơn 0")

    @validates("sort_order")
    def validate_sort_order(self, value, **kwargs):
        parsed_value = parse_int(value, "sort_order")
        if parsed_value is not None and parsed_value < 0:
            raise ValidationError("sort_order không được nhỏ hơn 0")

    @validates("status")
    def validate_status(self, value, **kwargs):
        parse_bool(value)


class BannerItemUpdateSchema(Schema):
    class Meta:
        unknown = RAISE

    banner_id = fields.Raw(required=False)
    url = fields.String(required=False, allow_none=True)
    sort_order = fields.Raw(required=False)
    status = fields.Raw(required=False)
    remove_image = fields.Raw(required=False)

    @validates("banner_id")
    def validate_banner_id(self, value, **kwargs):
        parsed_value = parse_int(value, "banner_id")
        if parsed_value is not None and parsed_value <= 0:
            raise ValidationError("banner_id phải lớn hơn 0")

    @validates("sort_order")
    def validate_sort_order(self, value, **kwargs):
        parsed_value = parse_int(value, "sort_order")
        if parsed_value is not None and parsed_value < 0:
            raise ValidationError("sort_order không được nhỏ hơn 0")

    @validates("status")
    def validate_status(self, value, **kwargs):
        parse_bool(value)

    @validates("remove_image")
    def validate_remove_image(self, value, **kwargs):
        parse_bool(value)