import { Link } from "react-router-dom";

export default function CategorySidebar({
  category,
  subcategories = [],
  activeSubcategorySlug = "",
}) {
  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h1 className="mb-8 text-3xl font-bold text-zinc-800">
        {category?.name}
      </h1>

      <div className="space-y-2">
        {subcategories.map((sub) => {
          const isActive = activeSubcategorySlug === sub.slug;

          return (
            <Link
              key={sub.id}
              to={`/${category?.slug}/${sub.slug}`}
              className={`block rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-zinc-700 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              {sub.name}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}