from app.extensions import db
from app.models.category import Category


class CategoryService:

    @staticmethod
    def create_category(name, description=None, status=True):
        # kiểm tra trùng tên
        existing = Category.query.filter_by(name=name).first()
        if existing:
            return None, "category already exists"

        category = Category(
            name=name,
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

        if name is not None:
            category.name = name

        if description is not None:
            category.description = description

        if status is not None:
            category.status = status

        db.session.commit()

        return category, None
    
    @staticmethod
    def get_categories():
        return Category.query.order_by(Category.id.asc()).all()

    @staticmethod
    def get_category(category_id):
        return Category.query.get(category_id)