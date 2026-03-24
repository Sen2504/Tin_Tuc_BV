import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPostDetailBySlugApi } from "@/api/postApi";
import { getCategorySubcategoriesBySlugApi } from "@/api/categoryApi";
import CategorySidebar from "@/components/CategorySidebar";
import "@/styles/post-content.css";

export default function PostPage() {
  const { categorySlug, subcategorySlug, postSlug } = useParams();

  const [post, setPost] = useState(null);
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPostPage();
  }, [categorySlug, subcategorySlug, postSlug]);

  async function loadPostPage() {
    setLoading(true);
    setMessage("");

    const [postResult, categoryResult] = await Promise.all([
      getPostDetailBySlugApi(categorySlug, subcategorySlug, postSlug),
      getCategorySubcategoriesBySlugApi(categorySlug),
    ]);

    if (!postResult.ok) {
      setMessage(postResult.data?.error || "Không tải được bài viết");
      setLoading(false);
      return;
    }

    if (!categoryResult.ok) {
      setMessage(categoryResult.data?.error || "Không tải được sidebar category");
      setLoading(false);
      return;
    }

    setPost(postResult.data.post || null);
    setCategory(categoryResult.data.category || null);
    setSubcategories(categoryResult.data.subcategories || []);
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

  if (!post) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-red-500">
        Không tìm thấy bài viết
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
        <Link to={`/${post.category.slug}`} className="hover:text-blue-600">
          {post.category.name}
        </Link>
        {" > "}
        <Link
          to={`/${post.category.slug}/${post.subcategory.slug}`}
          className="hover:text-blue-600"
        >
          {post.subcategory.name}
        </Link>
        {" > "}
        <span>{post.title}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <CategorySidebar
          category={category}
          subcategories={subcategories}
          activeSubcategorySlug={post.subcategory.slug}
        />

        <section>
          <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-bold leading-tight text-zinc-800">
              {post.title}
            </h1>

            <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-500">
              {post.author?.username && (
                <span>Tác giả: {post.author.username}</span>
              )}

              {post.create_at && (
                <span>
                  Ngày đăng: {new Date(post.create_at).toLocaleDateString("vi-VN")}
                </span>
              )}
            </div>

            {post.hashtag && (
              <div className="mt-4 text-sm font-medium text-blue-600">
                #{post.hashtag}
              </div>
            )}

            <div
              className="post-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        </section>
      </div>
    </div>
  );
}