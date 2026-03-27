from marshmallow import Schema, fields, validate, validates, ValidationError, RAISE
import re

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


class PostCreateSchema(Schema):
    class Meta:
        unknown = RAISE

    title = fields.String(
        required=True,
        error_messages={
            "required": "Tiêu đề bài viết là bắt buộc",
            "null": "Tiêu đề bài viết không được để trống"
        },
        validate=validate.Length(
            min=1,
            max=256,
            error="Tiêu đề bài viết phải từ 1 đến 256 ký tự"
        )
    )

    content = fields.String(
        required=True,
        error_messages={
            "required": "Nội dung bài viết là bắt buộc",
            "null": "Nội dung bài viết không được để trống"
        },
        validate=validate.Length(
            min=1,
            error="Nội dung bài viết không được để trống"
        )
    )

    hashtag = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(
            max=100,
            error="Hashtag không được vượt quá 100 ký tự"
        )
    )

    status = fields.Raw(required=False, load_default=True)

    subcategory_id = fields.Raw(
        required=True,
        error_messages={
            "required": "subcategory_id là bắt buộc",
            "null": "subcategory_id không được để trống"
        }
    )

    @validates("title")
    def validate_title(self, value, **kwargs):
        if not value or not value.strip():
            raise ValidationError("Tiêu đề bài viết không được để trống")

    @validates("content")
    def validate_content(self, value, **kwargs):
        if not value or not value.strip():
            raise ValidationError("Nội dung bài viết không được để trống")

    @validates("status")
    def validate_status(self, value, **kwargs):
        parse_bool(value)

    @validates("subcategory_id")
    def validate_subcategory_id(self, value, **kwargs):
        parsed_value = parse_int(value, "subcategory_id")
        if parsed_value is None:
            raise ValidationError("subcategory_id là bắt buộc")
        if parsed_value <= 0:
            raise ValidationError("subcategory_id phải lớn hơn 0")


class PostUpdateSchema(Schema):
    class Meta:
        unknown = RAISE

    title = fields.String(
        required=False,
        validate=validate.Length(
            min=1,
            max=256,
            error="Tiêu đề bài viết phải từ 1 đến 256 ký tự"
        )
    )

    content = fields.String(
        required=False,
        validate=validate.Length(
            min=1,
            error="Nội dung bài viết không được để trống"
        )
    )

    hashtag = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(
            max=100,
            error="Hashtag không được vượt quá 100 ký tự"
        )
    )

    status = fields.Raw(required=False)
    subcategory_id = fields.Raw(required=False)
    remove_thumbnail = fields.Raw(required=False)

    @validates("title")
    def validate_title(self, value, **kwargs):
        if value is not None and not value.strip():
            raise ValidationError("Tiêu đề bài viết không được để trống")

    @validates("content")
    def validate_content(self, value, **kwargs):
        if value is not None and not value.strip():
            raise ValidationError("Nội dung bài viết không được để trống")

    @validates("status")
    def validate_status(self, value, **kwargs):
        parse_bool(value)

    @validates("subcategory_id")
    def validate_subcategory_id(self, value, **kwargs):
        parsed_value = parse_int(value, "subcategory_id")
        if parsed_value is not None and parsed_value <= 0:
            raise ValidationError("subcategory_id phải lớn hơn 0")

    @validates("remove_thumbnail")
    def validate_remove_thumbnail(self, value, **kwargs):
        parse_bool(value)

class PostThumbnailResponseSchema(Schema):
    original_name = fields.String(allow_none=True)
    file_name = fields.String(allow_none=True)
    file_path = fields.String(allow_none=True)
    mime_type = fields.String(allow_none=True)
    file_size = fields.Integer(allow_none=True)


class AuthorResponseSchema(Schema):
    id = fields.Integer()
    username = fields.String(allow_none=True)


class CategoryBriefResponseSchema(Schema):
    id = fields.Integer()
    name = fields.String(allow_none=True)
    slug = fields.String(allow_none=True)


class SubcategoryBriefResponseSchema(Schema):
    id = fields.Integer()
    name = fields.String(allow_none=True)
    slug = fields.String(allow_none=True)


class PostResponseSchema(Schema):
    id = fields.Integer()
    title = fields.String()
    slug = fields.String()
    content = fields.String()
    # excerpt = fields.Method("get_excerpt")
    status = fields.Boolean()
    hashtag = fields.String(allow_none=True)
    subcategory_id = fields.Integer()
    user_id = fields.Integer()
    create_at = fields.Method("get_create_at")
    update_at = fields.Method("get_update_at")
    author = fields.Method("get_author")
    category = fields.Method("get_category")
    subcategory = fields.Method("get_subcategory")
    thumbnail = fields.Method("get_thumbnail")

    # def get_excerpt(self, obj):
    #     plain_text = re.sub(r"<[^>]+>", "", obj.content or "").strip()
    #     return plain_text[:180]

    def get_thumbnail(self, obj):
        if not obj.thumbnail_path:
            return None

        return PostThumbnailResponseSchema().dump({
            "original_name": obj.thumbnail_original_name,
            "file_name": obj.thumbnail_file_name,
            "file_path": obj.thumbnail_path,
            "mime_type": obj.thumbnail_mime_type,
            "file_size": obj.thumbnail_file_size,
        })

    def get_create_at(self, obj):
        return obj.create_at.isoformat() if obj.create_at else None

    def get_update_at(self, obj):
        return obj.update_at.isoformat() if obj.update_at else None

    def get_author(self, obj):
        if not obj.author:
            return None
        return AuthorResponseSchema().dump(obj.author)

    def get_category(self, obj):
        if not obj.subcategory or not obj.subcategory.category:
            return None
        return CategoryBriefResponseSchema().dump(obj.subcategory.category)

    def get_subcategory(self, obj):
        if not obj.subcategory:
            return None
        return SubcategoryBriefResponseSchema().dump(obj.subcategory)


class PostPublicListItemSchema(Schema):
    id = fields.Integer()
    title = fields.String()
    slug = fields.String()
    hashtag = fields.String(allow_none=True)
    create_at = fields.Method("get_create_at")
    author = fields.Method("get_author")
    thumbnail = fields.Method("get_thumbnail")

    def get_create_at(self, obj):
        return obj.create_at.isoformat() if obj.create_at else None

    def get_author(self, obj):
        if not obj.author:
            return None
        return AuthorResponseSchema().dump(obj.author)
    
    def get_thumbnail(self, obj):
        if not obj.thumbnail_path:
            return None

        return PostThumbnailResponseSchema().dump({
            "original_name": obj.thumbnail_original_name,
            "file_name": obj.thumbnail_file_name,
            "file_path": obj.thumbnail_path,
            "mime_type": obj.thumbnail_mime_type,
            "file_size": obj.thumbnail_file_size,
        })


class PostPublicDetailSchema(Schema):
    id = fields.Integer()
    title = fields.String()
    slug = fields.String()
    content = fields.String()
    hashtag = fields.String(allow_none=True)
    create_at = fields.Method("get_create_at")
    update_at = fields.Method("get_update_at")
    author = fields.Method("get_author")
    category = fields.Method("get_category")
    subcategory = fields.Method("get_subcategory")
    thumbnail = fields.Method("get_thumbnail")

    def get_create_at(self, obj):
        return obj.create_at.isoformat() if obj.create_at else None

    def get_update_at(self, obj):
        return obj.update_at.isoformat() if obj.update_at else None

    def get_author(self, obj):
        if not obj.author:
            return None
        return AuthorResponseSchema().dump(obj.author)

    def get_category(self, obj):
        if not obj.subcategory or not obj.subcategory.category:
            return None
        return CategoryBriefResponseSchema().dump(obj.subcategory.category)

    def get_subcategory(self, obj):
        if not obj.subcategory:
            return None
        return SubcategoryBriefResponseSchema().dump(obj.subcategory)

    def get_thumbnail(self, obj):
        if not obj.thumbnail_path:
            return None

        return PostThumbnailResponseSchema().dump({
            "original_name": obj.thumbnail_original_name,
            "file_name": obj.thumbnail_file_name,
            "file_path": obj.thumbnail_path,
            "mime_type": obj.thumbnail_mime_type,
            "file_size": obj.thumbnail_file_size,
        })