import re
import unicodedata


def slugify(value: str) -> str:
    value = (value or "").strip().lower()

    value = value.replace("đ", "d").replace("Đ", "d")

    value = unicodedata.normalize("NFD", value)
    value = value.encode("ascii", "ignore").decode("utf-8")

    value = re.sub(r"[^a-z0-9\s-]", "", value)
    value = re.sub(r"[\s-]+", "-", value).strip("-")

    return value or "item"


def generate_unique_slug(model, name: str, current_id=None):
    base_slug = slugify(name)
    slug = base_slug
    counter = 2

    while True:
        query = model.query.filter_by(slug=slug)

        if current_id is not None:
            query = query.filter(model.id != current_id)

        existed = query.first()

        if not existed:
            return slug

        slug = f"{base_slug}-{counter}"
        counter += 1