import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPostsBySubcategorySlugApi } from "@/api/postApi";
import { getCategorySubcategoriesBySlugApi } from "@/api/categoryApi";
import CategorySidebar from "@/components/CategorySidebar";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function SubCategoryPage() {
  const { categorySlug, subcategorySlug } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSubcategoryPage();
  }, [categorySlug, subcategorySlug]);

  async function loadSubcategoryPage() {
    setLoading(true);
    setMessage("");

    const [postResult, categoryResult] = await Promise.all([
      getPostsBySubcategorySlugApi(categorySlug, subcategorySlug),
      getCategorySubcategoriesBySlugApi(categorySlug),
    ]);

    if (!postResult.ok) {
      setMessage(postResult.data?.error || "Không tải được danh sách bài viết");
      setLoading(false);
      return;
    }

    if (!categoryResult.ok) {
      setMessage(categoryResult.data?.error || "Không tải được dữ liệu category");
      setLoading(false);
      return;
    }

    const fetchedPosts = postResult.data.posts || [];

    if (fetchedPosts.length === 1) {
      navigate(`/${categorySlug}/${subcategorySlug}/${fetchedPosts[0].slug}`, {
        replace: true,
      });
      return;
    }

    setCategory(categoryResult.data.category || postResult.data.category || null);
    setSubcategories(categoryResult.data.subcategories || []);
    setSubcategory(postResult.data.subcategory || null);
    setPosts(fetchedPosts);
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
        <Link to="/" className="hover:text-blue-600">
          Trang chủ
        </Link>
        {" > "}
        <Link to={`/${category?.slug}`} className="hover:text-blue-600">
          {category?.name}
        </Link>
        {" > "}
        <span>{subcategory?.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <CategorySidebar
          category={category}
          subcategories={subcategories}
          activeSubcategorySlug={subcategory?.slug}
        />

        <section>
          <h1 className="mb-2 text-3xl font-bold text-zinc-800">
            {subcategory?.name}
          </h1>

          {subcategory?.description && (
            <p className="mb-8 text-zinc-500">{subcategory.description}</p>
          )}

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-500">
              Subcategory này hiện chưa có bài viết.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/${category.slug}/${subcategory.slug}/${post.slug}`}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="aspect-[4/3] bg-zinc-100">
                    {post.thumbnail?.file_path ? (
                      <img
                        src={`${API_BASE_URL}${post.thumbnail.file_path}`}
                        alt={post.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                        Chưa có ảnh
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h2 className="text-lg font-bold text-zinc-800">
                      {post.title}
                    </h2>

                    {post.excerpt && (
                      <p className="mt-3 line-clamp-3 text-sm text-zinc-500">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="mt-4 text-sm font-medium text-blue-600">
                      Xem chi tiết →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}