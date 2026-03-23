from marshmallow import Schema, fields, validate, validates, ValidationError, pre_load, EXCLUDE


class CategoryBaseSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    @pre_load
    def normalize_input(self, data, **kwargs):
        data = dict(data or {})

        if "name" in data and data["name"] is not None:
            data["name"] = str(data["name"]).strip()

        if "description" in data and data["description"] is not None:
            data["description"] = str(data["description"]).strip()
            if data["description"] == "":
                data["description"] = None

        return data


class CategoryCreateSchema(CategoryBaseSchema):
    name = fields.String(
        required=True,
        error_messages={
            "required": "name is required",
            "null": "name cannot be null"
        },
        validate=validate.Length(
            min=1,
            max=255,
            error="name must be between 1 and 255 characters"
        )
    )

    description = fields.String(
        required=False,
        allow_none=True
    )

    status = fields.Boolean(
        required=False,
        load_default=True
    )

    @validates("name")
    def validate_name(self, value):
        if not value.strip():
            raise ValidationError("name cannot be empty")


class CategoryUpdateSchema(CategoryBaseSchema):
    name = fields.String(
        required=False,
        validate=validate.Length(
            min=1,
            max=255,
            error="name must be between 1 and 255 characters"
        )
    )

    description = fields.String(
        required=False,
        allow_none=True
    )

    status = fields.Boolean(
        required=False
    )

    @validates("name")
    def validate_name(self, value):
        if value is not None and not value.strip():
            raise ValidationError("name cannot be empty")


class CategoryResponseSchema(Schema):
    id = fields.Integer(dump_only=True)
    name = fields.String()
    slug = fields.String()
    description = fields.String(allow_none=True)
    status = fields.Boolean()
    create_at = fields.DateTime(dump_only=True)
    update_at = fields.DateTime(dump_only=True)


# Khởi tạo sẵn để import dùng luôn
category_create_schema = CategoryCreateSchema()
category_update_schema = CategoryUpdateSchema()
category_response_schema = CategoryResponseSchema()
category_response_list_schema = CategoryResponseSchema(many=True)