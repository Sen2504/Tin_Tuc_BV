from app.extensions import db
from app.models.category import Category
from app.utils.slug import generate_unique_slug


class CategoryService:

    @staticmethod
    def create_category(name, description=None, status=True):
        normalized_name = (name or "").strip()

        if not normalized_name:
            return None, "name is required"

        existing = Category.query.filter_by(name=normalized_name).first()
        if existing:
            return None, "category already exists"

        slug = generate_unique_slug(Category, normalized_name)

        category = Category(
            name=normalized_name,
            slug=slug,
            description=description,
            status=status
        )

        db.session.add(category)
        db.session.commit()

        return category, None

    @staticmethod
    def update_category(category_id, name=None, description=None, status=None):
        category = Category.query.get(category_id)

        if not category:
            return None, "category not found"

        next_name = category.name

        if name is not None and name.strip():
            next_name = name.strip()

            duplicated = Category.query.filter(
                Category.name == next_name,
                Category.id != category_id
            ).first()

            if duplicated:
                return None, "category already exists"

            category.name = next_name
            category.slug = generate_unique_slug(
                Category,
                next_name,
                current_id=category_id
            )

        if description is not None:
            category.description = description

        if status is not None:
            category.status = status

        db.session.commit()

        return category, None

    @staticmethod
    def get_categories():
        return Category.query.order_by(Category.id).all()

    @staticmethod
    def get_category(category_id):
        return Category.query.get(category_id)

    @staticmethod
    def get_category_by_slug(slug):
        return Category.query.filter_by(slug=slug, status=True).first()