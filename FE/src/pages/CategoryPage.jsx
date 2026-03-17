import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCategorySubcategoriesBySlugApi } from "../api/categoryApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function CategoryPage() {
  const { categorySlug } = useParams();

  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadCategoryPage();
  }, [categorySlug]);

  async function loadCategoryPage() {
    setLoading(true);
    setMessage("");

    const result = await getCategorySubcategoriesBySlugApi(categorySlug);

    if (!result.ok) {
      setMessage(result.data?.error || "Không tải được dữ liệu category");
      setLoading(false);
      return;
    }

    setCategory(result.data.category || null);
    setSubcategories(result.data.subcategories || []);
    setLoading(false);
  }

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-8">Đang tải...</div>;
  }

  if (message) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-red-500">
        {message}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 text-sm text-zinc-500">
        Trang chủ &gt; {category?.name}
      </div>

      <h1 className="mb-8 text-3xl font-bold text-zinc-800">
        {category?.name}
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-zinc-800">
            Danh mục con
          </h2>

          <div className="space-y-2">
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                to={`/${category.slug}/${sub.slug}`}
                className="block rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-blue-50 hover:text-blue-600"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </aside>

        <section>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                to={`/${category.slug}/${sub.slug}`}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="aspect-[4/3] bg-zinc-100">
                  {sub.thumbnail?.file_path ? (
                    <img
                      src={`${API_BASE_URL}${sub.thumbnail.file_path}`}
                      alt={sub.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                      Chưa có ảnh
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-zinc-800">
                    {sub.name}
                  </h3>

                  {sub.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                      {sub.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}