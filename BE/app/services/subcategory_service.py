from app.extensions import db
from app.models.sub_category import SubCategory
from app.models.category import Category


class SubCategoryService:

    @staticmethod
    def create_subcategory(name, category_id, description=None, status=True):

        # kiểm tra category tồn tại
        category = Category.query.get(category_id)

        if not category:
            return None, "category not found"

        # kiểm tra trùng tên trong cùng category
        existing = SubCategory.query.filter_by(
            name=name,
            category_id=category_id
        ).first()

        if existing:
            return None, "subcategory already exists"

        subcategory = SubCategory(
            name=name,
            description=description,
            status=status,
            category_id=category_id
        )

        db.session.add(subcategory)
        db.session.commit()

        return subcategory, None


    @staticmethod
    def update_subcategory(subcategory_id, name=None, description=None, status=None, category_id=None):

        subcategory = SubCategory.query.get(subcategory_id)

        if not subcategory:
            return None, "subcategory not found"

        if name is not None:
            subcategory.name = name

        if description is not None:
            subcategory.description = description

        if status is not None:
            subcategory.status = status

        if category_id is not None:

            category = Category.query.get(category_id)

            if not category:
                return None, "category not found"

            subcategory.category_id = category_id

        db.session.commit()

        return subcategory, None
    
    @staticmethod
    def get_subcategories():

        return SubCategory.query.order_by(SubCategory.id.desc()).all()


    @staticmethod
    def get_subcategory(subcategory_id):

        return SubCategory.query.get(subcategory_id)