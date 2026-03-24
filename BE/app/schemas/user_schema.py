import re
from marshmallow import Schema, fields, validates, ValidationError


def normalize_role(value):
    return (value or "").strip().lower()


class UserCreateSchema(Schema):
    username = fields.Str(required=True)
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)
    role = fields.Str(load_default="staff")
    is_active = fields.Bool(load_default=True)

    @validates("username")
    def validate_username(self, value, **kwargs):
        value = (value or "").strip()

        if not value:
            raise ValidationError("Username is required.")

        if len(value) < 3:
            raise ValidationError("Username must be at least 3 characters.")

        if len(value) > 100:
            raise ValidationError("Username must not exceed 100 characters.")

    @validates("password")
    def validate_password(self, value, **kwargs):
        if len(value or "") < 8:
            raise ValidationError("Password must be at least 8 characters.")

        if not re.search(r"[A-Za-z]", value):
            raise ValidationError("Password must contain at least one letter.")

        if not re.search(r"\d", value):
            raise ValidationError("Password must contain at least one digit.")

    @validates("role")
    def validate_role(self, value, **kwargs):
        if normalize_role(value) not in ["admin", "staff"]:
            raise ValidationError("Role must be either 'admin' or 'staff'.")


class UserUpdateSchema(Schema):
    username = fields.Str(required=False)
    email = fields.Email(required=False)
    password = fields.Str(required=False, load_only=True)
    role = fields.Str(required=False)
    is_active = fields.Bool(required=False)

    @validates("username")
    def validate_username(self, value, **kwargs):
        value = (value or "").strip()

        if not value:
            raise ValidationError("Username cannot be empty.")

        if len(value) < 3:
            raise ValidationError("Username must be at least 3 characters.")

        if len(value) > 100:
            raise ValidationError("Username must not exceed 100 characters.")

    @validates("password")
    def validate_password(self, value, **kwargs):
        if len(value or "") < 8:
            raise ValidationError("Password must be at least 8 characters.")

        if not re.search(r"[A-Za-z]", value):
            raise ValidationError("Password must contain at least one letter.")

        if not re.search(r"\d", value):
            raise ValidationError("Password must contain at least one digit.")

    @validates("role")
    def validate_role(self, value, **kwargs):
        if normalize_role(value) not in ["admin", "staff"]:
            raise ValidationError("Role must be either 'admin' or 'staff'.")


class UserResponseSchema(Schema):
    id = fields.Int(dump_only=True)
    username = fields.Str()
    email = fields.Email()
    role = fields.Str()
    is_active = fields.Bool()
    confirmed = fields.Bool()
    confirmed_at = fields.DateTime(allow_none=True)
    created_at = fields.DateTime()


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)
    remember = fields.Bool(load_default=True)


class ResendConfirmSchema(Schema):
    email = fields.Email(required=True)