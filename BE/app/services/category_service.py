from app.extensions import db
from app.models.category import Category
from app.utils.slug import generate_unique_slug
from sqlalchemy import func, distinct
from app.models.sub_category import SubCategory
from app.models.post import Post

def normalize_bool(value):
    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        value = value.strip().lower()
        if value in {"true", "1", "yes", "on"}:
            return True
        if value in {"false", "0", "no", "off"}:
            return False

    if isinstance(value, int):
        return bool(value)

    return value


class CategoryService:

    @staticmethod
    def get_category(category_id):
        return Category.query.get(category_id)

    @staticmethod
    def create_category(name, description=None, status=True):
        normalized_name = (name or "").strip()

        if not normalized_name:
            return None, "Tên danh mục là bắt buộc"

        existing = Category.query.filter_by(name=normalized_name).first()
        if existing:
            return None, "Danh mục đã tồn tại"

        slug = generate_unique_slug(Category, normalized_name)

        category = Category(
            name=normalized_name,
            slug=slug,
            description=description.strip() if isinstance(description, str) else description,
            status=normalize_bool(status)
        )

        db.session.add(category)
        db.session.commit()

        return category, None

    @staticmethod
    def update_category(category_id, name=None, description=None, status=None):
        category = Category.query.get(category_id)

        if not category:
            return None, "Danh mục không tồn tại"

        if name is not None:
            next_name = name.strip()

            if not next_name:
                return None, "Tên danh mục là bắt buộc"

            duplicated = Category.query.filter(
                Category.name == next_name,
                Category.id != category_id
            ).first()

            if duplicated:
                return None, "Danh mục đã tồn tại"

            category.name = next_name
            category.slug = generate_unique_slug(
                Category,
                next_name,
                current_id=category_id
            )

        if description is not None:
            category.description = description.strip() if isinstance(description, str) else description

        if status is not None:
            category.status = normalize_bool(status)

        db.session.commit()

        return category, None
    
    @staticmethod
    def delete_category(category_id):
        category = Category.query.get(category_id)

        if not category:
            return False, "Danh mục không tồn tại"

        try:
            db.session.delete(category)
            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)

    @staticmethod
    def get_category_by_slug(slug):
        return Category.query.filter_by(slug=slug, status=True).first()

# ======================================================================================
# Các hàm lấy dữ liệu tổng hợp để hiển thị ở trang quản trị
    @staticmethod
    def get_category_list_summary(include_inactive=False):
        query = (
            db.session.query(
                Category.id.label("id"),
                Category.name.label("name"),
                Category.slug.label("slug"),
                Category.description.label("description"),
                Category.status.label("status"),
                func.count(distinct(SubCategory.id)).label("subcategories_count"),
                func.count(distinct(Post.id)).label("posts_count"),
            )
            .outerjoin(SubCategory, SubCategory.category_id == Category.id)
            .outerjoin(Post, Post.subcategory_id == SubCategory.id)
            .group_by(
                Category.id,
                Category.name,
                Category.slug,
                Category.description,
                Category.status
            )
            .order_by(Category.id)
        )

        if not include_inactive:
            query = query.filter(Category.status.is_(True))

        rows = query.all()

        return [
            {
                "id": row.id,
                "name": row.name,
                "slug": row.slug,
                "description": row.description,
                "status": row.status,
                "subcategories_count": row.subcategories_count or 0,
                "posts_count": row.posts_count or 0,
            }
            for row in rows
        ]
    
    @staticmethod
    def get_category_summary_by_id(category_id):
        row = (
            db.session.query(
                Category.id.label("id"),
                Category.name.label("name"),
                Category.description.label("description"),
                Category.status.label("status"),
                func.count(distinct(SubCategory.id)).label("subcategories_count"),
                func.count(distinct(Post.id)).label("posts_count"),
            )
            .outerjoin(SubCategory, SubCategory.category_id == Category.id)
            .outerjoin(Post, Post.subcategory_id == SubCategory.id)
            .filter(Category.id == category_id)
            .group_by(
                Category.id,
                Category.name,
                Category.description,
                Category.status
            )
            .first()
        )

        if not row:
            return None

        return {
            "id": row.id,
            "name": row.name,
            "description": row.description,
            "status": row.status,
            "subcategories_count": row.subcategories_count or 0,
            "posts_count": row.posts_count or 0,
        }

    @staticmethod
    def get_category_options(include_inactive=False):
        query = db.session.query(
            Category.id.label("id"),
            Category.name.label("name")
        ).order_by(Category.id)

        if not include_inactive:
            query = query.filter(Category.status.is_(True))

        return query.all(), None