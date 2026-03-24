import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getCategoriesApi } from "@/api/categoryApi";
import { getPostsBySubcategorySlugApi } from "@/api/postApi";

function formatDate(value) {
  if (!value) return "Đang cập nhật";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Đang cập nhật";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function normalizePosts(items = []) {
  return items
    .filter((item) => item?.slug)
    .sort((a, b) => new Date(b.create_at || 0) - new Date(a.create_at || 0));
}

function normalizeText(value = "") {
  return String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const bannerSlides = [
  {
    title: "Chăm sóc phục hồi chức năng toàn diện",
    description:
      "Kết nối bác sĩ, điều dưỡng và đội ngũ chuyên môn để đồng hành cùng người bệnh trong từng giai đoạn hồi phục.",
    badge: "Chăm sóc chuẩn y khoa",
  },
  {
    title: "Cập nhật thông tin y tế minh bạch",
    description:
      "Theo dõi lịch khám, hướng dẫn điều trị và các bản tin sức khỏe mới nhất ngay trên cổng thông tin bệnh viện.",
    badge: "Tin tức mỗi ngày",
  },
  {
    title: "Dịch vụ thân thiện cho cộng đồng",
    description:
      "Không gian hiện đại, quy trình rõ ràng và hỗ trợ nhanh giúp người dân tiếp cận dịch vụ y tế dễ dàng hơn.",
    badge: "Đồng hành vì sức khỏe",
  },
];

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [latestNewsPosts, setLatestNewsPosts] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeBanner, setActiveBanner] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadHomeData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % bannerSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  async function loadHomeData() {
    setLoading(true);
    setMessage("");

    const categoryResult = await getCategoriesApi();

    if (!categoryResult.ok) {
      setMessage(categoryResult.data?.error || "Không tải được danh mục");
      setLoading(false);
      return;
    }

    const fetchedCategories = categoryResult.data?.categories || [];
    setCategories(fetchedCategories);

    const allCategorySubcategoryPairs = fetchedCategories.flatMap((category) =>
      (category.subcategories || []).map((subcategory) => ({
        category,
        subcategory,
      }))
    );

    if (allCategorySubcategoryPairs.length === 0) {
      setLatestNewsPosts([]);
      setLatestPosts([]);
      setLoading(false);
      return;
    }

    const postResults = await Promise.all(
      allCategorySubcategoryPairs.map(({ category, subcategory }) =>
        getPostsBySubcategorySlugApi(category.slug, subcategory.slug)
      )
    );

    const allPosts = [];

    postResults.forEach((result, index) => {
      if (!result.ok) return;

      const { category, subcategory } = allCategorySubcategoryPairs[index];
      const posts = result.data?.posts || [];

      posts.forEach((post) => {
        allPosts.push({
          ...post,
          categorySlug: category.slug,
          categoryName: category.name,
          subcategorySlug: subcategory.slug,
          subcategoryName: subcategory.name,
        });
      });
    });

    const normalizedAllPosts = normalizePosts(allPosts);

    const newsCategory = fetchedCategories.find(
      (category) =>
        category.slug === "tin-tuc" ||
        category.name?.toLowerCase().includes("tin tức")
    );

    const normalizedNewsPosts = normalizedAllPosts.filter(
      (post) => post.categorySlug === newsCategory?.slug
    );

    setAllPosts(normalizedAllPosts);
    setLatestNewsPosts(normalizedNewsPosts.slice(0, 6));
    setLatestPosts(normalizedAllPosts.slice(0, 8));
    setLoading(false);
  }

  const currentSlide = useMemo(() => bannerSlides[activeBanner], [activeBanner]);

  const quickCategoryLinks = useMemo(() => {
    return categories
      .slice(0, 6)
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        subcategories: category.subcategories || [],
      }));
  }, [categories]);

  const searchResults = useMemo(() => {
    const keyword = normalizeText(searchTerm.trim());
    if (!keyword) return [];

    const categoryMatches = categories
      .filter((category) => normalizeText(category.name).includes(keyword))
      .map((category) => ({
        key: `cat-${category.id}`,
        label: category.name,
        description: "Chuyên mục",
        to: `/${category.slug}`,
      }));

    const subcategoryMatches = categories
      .flatMap((category) =>
        (category.subcategories || []).map((subcategory) => ({
          id: `${category.id}-${subcategory.id}`,
          label: subcategory.name,
          description: `${category.name}`,
          to: `/${category.slug}/${subcategory.slug}`,
        }))
      )
      .filter((item) => normalizeText(item.label).includes(keyword))
      .map((item) => ({
        key: `sub-${item.id}`,
        label: item.label,
        description: `Danh mục con - ${item.description}`,
        to: item.to,
      }));

    const postMatches = allPosts
      .filter((post) => normalizeText(post.title).includes(keyword))
      .slice(0, 8)
      .map((post) => ({
        key: `post-${post.id}-${post.slug}`,
        label: post.title,
        description: `${post.categoryName} - ${post.subcategoryName}`,
        to: `/${post.categorySlug}/${post.subcategorySlug}/${post.slug}`,
      }));

    return [...postMatches, ...subcategoryMatches, ...categoryMatches].slice(0, 10);
  }, [searchTerm, categories, allPosts]);

  const featuredNews = latestNewsPosts[0] || null;
  const secondaryNews = latestNewsPosts.slice(1, 6);

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_10%_20%,#fef3c7_0%,#fff7ed_30%,#eff6ff_65%,#f8fafc_100%)]">
      <div className="pointer-events-none absolute -top-28 right-12 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative mx-auto max-w-[1400px] space-y-8 px-5 py-8 sm:px-6 lg:space-y-10 lg:py-10">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-[30px] border border-orange-100/70 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-6 text-white shadow-[0_35px_95px_-45px_rgba(194,65,12,0.8)] sm:p-8">
            <div className="flex flex-col gap-8">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.13em]">
                <span className="rounded-full border border-white/40 bg-white/15 px-3 py-1">
                  Cổng thông tin bệnh viện
                </span>
                <span className="rounded-full border border-white/40 bg-white/15 px-3 py-1">
                  {currentSlide.badge}
                </span>
              </div>

              <div>
                <h1 className="max-w-4xl text-3xl font-black leading-tight text-white sm:text-4xl lg:text-[42px]">
                  {currentSlide.title}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-orange-50 sm:text-base">
                  {currentSlide.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/tin-tuc"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-orange-700 transition hover:bg-orange-50"
                >
                  Tin tức mới nhất
                </Link>

                <a
                  href="tel:02773895115"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/45 bg-white/15 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/25"
                >
                  Gọi cấp cứu 02773 895 115
                </a>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                {bannerSlides.map((slide, index) => (
                  <button
                    key={slide.title}
                    type="button"
                    onClick={() => setActiveBanner(index)}
                    className={`h-2.5 rounded-full transition ${
                      activeBanner === index ? "w-10 bg-white" : "w-2.5 bg-white/55"
                    }`}
                    aria-label={`Chuyển banner ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-sky-100 bg-white/90 p-5 shadow-[0_20px_50px_-38px_rgba(2,132,199,0.6)] backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.13em] text-sky-500">Tìm nhanh</p>
              <h2 className="mt-2 text-lg font-black text-slate-900">Bạn cần tìm gì hôm nay?</h2>

              <div className="relative mt-4">
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm bài viết, danh mục, chuyên mục..."
                  className="w-full rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white"
                />

                {searchTerm.trim() && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                    {searchResults.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-slate-500">Không tìm thấy kết quả phù hợp.</p>
                    ) : (
                      <div className="space-y-1">
                        {searchResults.map((result) => (
                          <Link
                            key={result.key}
                            to={result.to}
                            onClick={() => setSearchTerm("")}
                            className="block rounded-xl px-3 py-2 transition hover:bg-sky-50"
                          >
                            <p className="line-clamp-1 text-sm font-bold text-slate-800">{result.label}</p>
                            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{result.description}</p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm shadow-emerald-100/70">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">Bài viết mới</p>
                <p className="mt-2 text-4xl font-black text-emerald-900">{latestPosts.length}</p>
                <p className="mt-2 text-sm text-emerald-700/80">Tin mới nhất trên toàn hệ thống.</p>
              </div>

              <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5 shadow-sm shadow-indigo-100/70">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-600">Chuyên mục</p>
                <p className="mt-2 text-4xl font-black text-indigo-900">{categories.length}</p>
                <p className="mt-2 text-sm text-indigo-700/80">Điều hướng nhanh theo nhu cầu.</p>
              </div>
            </div>
          </aside>
        </section>

        {message && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {message}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_25px_55px_-45px_rgba(15,23,42,0.9)] sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">Tin tức mới nhất</h2>
              <Link to="/tin-tuc" className="text-sm font-bold text-orange-600 transition hover:text-orange-700">
                Xem tất cả
              </Link>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                Đang tải dữ liệu tin tức...
              </div>
            ) : !featuredNews ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                Mục tin tức hiện chưa có bài viết.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[1.15fr_minmax(0,1fr)]">
                <Link
                  to={`/${featuredNews.categorySlug}/${featuredNews.subcategorySlug}/${featuredNews.slug}`}
                  className="group overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg shadow-orange-200/60"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-orange-100">
                    Bài nổi bật
                  </p>
                  <h3 className="mt-3 line-clamp-3 text-2xl font-black leading-tight text-white transition group-hover:text-orange-50">
                    {featuredNews.title}
                  </h3>
                  <div className="mt-6 flex items-center justify-between text-xs text-orange-100">
                    <span>{formatDate(featuredNews.create_at)}</span>
                    <span>{featuredNews.author?.username || "Ban biên tập"}</span>
                  </div>
                </Link>

                <div className="space-y-3">
                  {secondaryNews.map((post) => (
                    <Link
                      key={`${post.id}-${post.slug}`}
                      to={`/${post.categorySlug}/${post.subcategorySlug}/${post.slug}`}
                      className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-orange-200 hover:bg-orange-50"
                    >
                      <p className="line-clamp-2 text-sm font-extrabold text-slate-800">{post.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {post.subcategoryName || "Tin tức"} - {formatDate(post.create_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_25px_55px_-45px_rgba(15,23,42,0.9)] sm:p-6">
            <h2 className="text-xl font-black text-slate-900">Bài viết mới cập nhật</h2>
            <p className="mt-1 text-sm text-slate-500">Giúp bạn theo dõi nhanh các nội dung vừa đăng.</p>

            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                  Đang tải danh sách bài viết...
                </div>
              ) : latestPosts.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                  Chưa có bài viết để hiển thị.
                </div>
              ) : (
                latestPosts.map((post, index) => (
                  <Link
                    key={`${post.id}-${post.slug}-${index}`}
                    to={`/${post.categorySlug}/${post.subcategorySlug}/${post.slug}`}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 transition hover:border-sky-200 hover:bg-sky-50"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-black text-sky-700">
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-bold text-slate-800">{post.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {post.categoryName} - {formatDate(post.create_at)}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </aside>
        </section>
      </div>
    </section>
  );
}