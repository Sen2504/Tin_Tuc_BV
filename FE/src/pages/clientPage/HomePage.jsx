import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getActiveBannersPublicApi } from "@/api/bannerApi";
import { getCategoriesApi } from "@/api/categoryApi";
import { getPublicInfosApi } from "@/api/infoApi";
import { getPublicInfoStatsApi } from "@/api/info_statApi";
import { getPostsBySubcategorySlugApi } from "@/api/postApi";

const API_ORIGIN =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, "") ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

const INITIAL_NEWS_COUNT = 3;
const LOAD_MORE_NEWS_COUNT = 2;
const MAX_LATEST_POSTS = 4;
const MAX_ANNOUNCEMENT_POSTS = 3;

function formatDateTime(value) {
  if (!value) return "Đang cập nhật";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Đang cập nhật";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
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
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildImageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}

function getPostThumbnail(post) {
  return (
    post?.thumbnail?.file_path ||
    post?.thumbnail_path ||
    post?.thumbnail?.url ||
    ""
  );
}

function getPostExcerpt(post) {
  return (
    post?.excerpt ||
    post?.summary ||
    post?.description ||
    "Nội dung đang được cập nhật."
  );
}

function isCategoryMatch(category, keywords = []) {
  const slug = normalizeText(category?.slug || "");
  const name = normalizeText(category?.name || "");

  return keywords.some((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    return slug.includes(normalizedKeyword) || name.includes(normalizedKeyword);
  });
}

function useInViewOnce({ rootMargin = "0px", threshold = 0.12 } = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) return;

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isVisible, rootMargin, threshold]);

  return [ref, isVisible];
}

function usePrefetchAndReveal({
  prefetchMargin = "300px 0px",
  revealMargin = "40px 0px",
  revealThreshold = 0.12,
} = {}) {
  const ref = useRef(null);
  const [shouldPrefetch, setShouldPrefetch] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefetchObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldPrefetch(true);
          prefetchObserver.disconnect();
        }
      },
      { rootMargin: prefetchMargin, threshold: 0.01 }
    );

    const revealObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          revealObserver.disconnect();
        }
      },
      { rootMargin: revealMargin, threshold: revealThreshold }
    );

    prefetchObserver.observe(node);
    revealObserver.observe(node);

    return () => {
      prefetchObserver.disconnect();
      revealObserver.disconnect();
    };
  }, [prefetchMargin, revealMargin, revealThreshold]);

  return [ref, shouldPrefetch, isVisible];
}

function revealClass(visible) {
  const base =
    "transform-gpu transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]";

  return visible
    ? `${base} translate-y-0 scale-100 opacity-100`
    : `${base} translate-y-8 scale-[0.985] opacity-0`;
}

function itemRevealClass(visible, direction = "up") {
  const base =
    "transform-gpu transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform";

  if (visible) {
    return `${base} translate-x-0 translate-y-0 scale-100 opacity-100 blur-0`;
  }

  if (direction === "left") {
    return `${base} -translate-x-12 translate-y-1 opacity-0 blur-[2px]`;
  }

  if (direction === "right") {
    return `${base} translate-x-12 translate-y-1 opacity-0 blur-[2px]`;
  }

  if (direction === "pop") {
    return `${base} translate-y-5 scale-[0.97] opacity-0 blur-[1px]`;
  }

  return `${base} translate-y-7 opacity-0 blur-[1px]`;
}

function revealDelayStyle(delay = 0) {
  return { transitionDelay: `${delay}ms` };
}

function isAbsoluteHttpUrl(url = "") {
  return /^https?:\/\//i.test(url);
}

function normalizeBannerUrl(url = "") {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (isAbsoluteHttpUrl(trimmed)) return trimmed;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function SidebarPostCard({
  post,
  compact = false,
  shouldReveal = false,
  delay = 0,
  direction = "right",
}) {
  const thumbnailUrl = buildImageUrl(getPostThumbnail(post));

  return (
    <Link
      to={`/${post.categorySlug}/${post.subcategorySlug}/${post.slug}`}
      className={`group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-cyan-200 hover:bg-cyan-50/50 ${itemRevealClass(
        shouldReveal,
        direction
      )}`}
      style={revealDelayStyle(delay)}
    >
      <div className="h-[72px] w-[96px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={post.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-slate-400">
            No image
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h3
          className={`line-clamp-2 font-bold text-slate-800 transition group-hover:text-cyan-700 ${
            compact ? "text-[14px]" : "text-sm"
          }`}
        >
          {post.title}
        </h3>

        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
          {getPostExcerpt(post)}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-400">
          <span>{formatDateTime(post.create_at)}</span>
          {post.views != null && <span>{post.views} lượt xem</span>}
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [bannerItems, setBannerItems] = useState([]);
  const [homeInfo, setHomeInfo] = useState(null);
  const [homeInfoStats, setHomeInfoStats] = useState([]);
  const [newsPosts, setNewsPosts] = useState([]);
  const [announcementPosts, setAnnouncementPosts] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [infoLoaded, setInfoLoaded] = useState(false);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [activeBanner, setActiveBanner] = useState(0);
  const [visibleNewsCount, setVisibleNewsCount] = useState(INITIAL_NEWS_COUNT);
  const [infoError, setInfoError] = useState("");
  const [postError, setPostError] = useState("");

  const [bannerRef, bannerVisible] = useInViewOnce({ threshold: 0.06 });
  const [infoRef, infoShouldPrefetch, infoVisible] = usePrefetchAndReveal({
    prefetchMargin: "420px 0px",
    revealMargin: "80px 0px",
    revealThreshold: 0.1,
  });
  const [postsRef, postsShouldPrefetch, postsVisible] = usePrefetchAndReveal({
    prefetchMargin: "500px 0px",
    revealMargin: "120px 0px",
    revealThreshold: 0.08,
  });

  useEffect(() => {
    loadBannerData();
  }, []);

  useEffect(() => {
    if (!infoShouldPrefetch || infoLoaded || loadingInfo) return;
    loadInfoSectionData();
  }, [infoShouldPrefetch, infoLoaded, loadingInfo]);

  useEffect(() => {
    if (!postsShouldPrefetch || postsLoaded || loadingPosts) return;
    loadPostSectionsData();
  }, [postsShouldPrefetch, postsLoaded, loadingPosts]);

  useEffect(() => {
    if (bannerItems.length <= 1) return;

    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % bannerItems.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [bannerItems.length]);

  useEffect(() => {
    const mergedMessage = [infoError, postError].filter(Boolean).join(" | ");
    setMessage(mergedMessage);
  }, [infoError, postError]);

  async function loadBannerData() {
    try {
      const result = await getActiveBannersPublicApi();

      if (!result.ok) {
        setBannerItems([]);
        return;
      }

      const banners = result.data?.banners || [];
      const mergedItems = banners.flatMap((banner) => banner.banner_items || []);
      const usableItems = mergedItems
        .filter((item) => item?.media?.file_path)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

      setBannerItems(usableItems);
      setActiveBanner(0);
    } catch {
      setBannerItems([]);
    }
  }

  async function loadInfoSectionData() {
    setLoadingInfo(true);
    setInfoError("");

    try {
      const infoResult = await getPublicInfosApi();

      if (infoResult.ok) {
        const infos = infoResult.data?.infos || [];
        const infoItem = infos[0] || null;
        setHomeInfo(infoItem);

        if (infoItem?.id) {
          const infoStatsResult = await getPublicInfoStatsApi(infoItem.id);

          if (infoStatsResult.ok) {
            setHomeInfoStats(infoStatsResult.data?.info_stats || []);
          } else {
            setHomeInfoStats([]);
          }
        } else {
          setHomeInfoStats([]);
        }
      } else {
        setHomeInfo(null);
        setHomeInfoStats([]);
        setInfoError(infoResult.data?.error || "Không tải được thông tin bệnh viện");
      }

      setInfoLoaded(true);
    } catch (error) {
      setInfoError("Có lỗi xảy ra khi tải khối thông tin bệnh viện");
      setInfoLoaded(true);
    } finally {
      setLoadingInfo(false);
    }
  }

  async function loadPostSectionsData() {
    setLoadingPosts(true);
    setPostError("");

    try {
      const categoryResult = await getCategoriesApi();

      if (!categoryResult.ok) {
        setPostError(categoryResult.data?.error || "Không tải được danh mục");
        setPostsLoaded(true);
        return;
      }

      const fetchedCategories = categoryResult.data?.categories || [];

      const allCategorySubcategoryPairs = fetchedCategories.flatMap((category) =>
        (category.subcategories || []).map((subcategory) => ({
          category,
          subcategory,
        }))
      );

      if (allCategorySubcategoryPairs.length === 0) {
        setNewsPosts([]);
        setAnnouncementPosts([]);
        setLatestPosts([]);
        setPostsLoaded(true);
        return;
      }

      const postResults = await Promise.all(
        allCategorySubcategoryPairs.map(({ category, subcategory }) =>
          getPostsBySubcategorySlugApi(category.slug, subcategory.slug)
        )
      );

      const mergedPosts = [];

      postResults.forEach((result, index) => {
        if (!result.ok) return;

        const { category, subcategory } = allCategorySubcategoryPairs[index];
        const posts = result.data?.posts || [];

        posts.forEach((post) => {
          mergedPosts.push({
            ...post,
            categorySlug: category.slug,
            categoryName: category.name,
            subcategorySlug: subcategory.slug,
            subcategoryName: subcategory.name,
          });
        });
      });

      const normalizedAllPosts = normalizePosts(mergedPosts);

      const newsCategory = fetchedCategories.find((category) =>
        isCategoryMatch(category, ["tin-tuc", "tin tức"])
      );

      const announcementCategory = fetchedCategories.find((category) =>
        isCategoryMatch(category, ["thong-bao", "thông báo"])
      );

      const normalizedNewsPosts = normalizedAllPosts.filter(
        (post) => post.categorySlug === newsCategory?.slug
      );

      const normalizedAnnouncementPosts = normalizedAllPosts.filter(
        (post) => post.categorySlug === announcementCategory?.slug
      );

      setNewsPosts(normalizedNewsPosts);
      setAnnouncementPosts(normalizedAnnouncementPosts);
      setLatestPosts(normalizedAllPosts.slice(0, MAX_LATEST_POSTS));
      setVisibleNewsCount(INITIAL_NEWS_COUNT);
      setPostsLoaded(true);
    } catch (error) {
      setPostError("Có lỗi xảy ra khi tải dữ liệu tin tức trang chủ");
      setPostsLoaded(true);
    } finally {
      setLoadingPosts(false);
    }
  }

  const currentSlide = useMemo(() => {
    if (bannerItems.length === 0) return null;
    return bannerItems[Math.min(activeBanner, bannerItems.length - 1)] || null;
  }, [bannerItems, activeBanner]);

  const currentBannerUrl = normalizeBannerUrl(currentSlide?.url || "");

  function handleBannerNavigate() {
    if (!currentBannerUrl) return;

    if (isAbsoluteHttpUrl(currentBannerUrl)) {
      window.open(currentBannerUrl, "_blank", "noopener,noreferrer");
      return;
    }

    navigate(currentBannerUrl);
  }

  function handleBannerContainerClick(event) {
    const interactiveTarget = event.target.closest("a,button,input,textarea,select,label");
    if (interactiveTarget) return;
    handleBannerNavigate();
  }

  const featuredNews = newsPosts[0] || null;
  const remainingNewsPosts = newsPosts.slice(1);
  const visibleNewsList = remainingNewsPosts.slice(0, visibleNewsCount);
  const hasMoreNews = visibleNewsCount < remainingNewsPosts.length;

  const sidebarLatestPosts = latestPosts.slice(0, MAX_LATEST_POSTS);
  const sidebarAnnouncementPosts = announcementPosts.slice(0, MAX_ANNOUNCEMENT_POSTS);
  const homeInfoImageUrl = buildImageUrl(homeInfo?.image || "");
  const pendingPosts = postsShouldPrefetch && loadingPosts;

  function handleLoadMoreNews() {
    setVisibleNewsCount((prev) => prev + LOAD_MORE_NEWS_COUNT);
  }

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_10%_20%,#dcfce7_0%,#f0fdf4_30%,#ecfeff_65%,#f8fafc_100%)]">
      <div className="pointer-events-none absolute -top-28 right-12 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-green-200/40 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1450px] space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:space-y-10 lg:py-10">
        <section
          ref={bannerRef}
          className={`relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen ${revealClass(
            bannerVisible
          )}`}
        >
          <div
            className={`overflow-hidden border-y border-slate-200/70 bg-slate-700 px-4 py-8 text-white shadow-[0_35px_95px_-45px_rgba(15,23,42,0.8)] sm:px-6 sm:py-10 lg:px-8 lg:py-12 ${
              currentBannerUrl ? "cursor-pointer" : ""
            }`}
            style={
              currentSlide?.media?.file_path
                ? {
                    backgroundImage: `linear-gradient(rgba(2, 6, 23, 0.24), rgba(2, 6, 23, 0.34)), url(${buildImageUrl(
                      currentSlide.media.file_path
                    )})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
            onClick={handleBannerContainerClick}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleBannerNavigate();
              }
            }}
            tabIndex={currentBannerUrl ? 0 : -1}
            role={currentBannerUrl ? "button" : "region"}
            aria-label={currentBannerUrl ? "Mở liên kết banner" : "Banner"}
          >
            <div className="flex min-h-[320px] items-end sm:min-h-[380px] lg:min-h-[430px]">
              <div
                className={`mt-1 flex flex-wrap items-center gap-2 ${itemRevealClass(
                  bannerVisible,
                  "pop"
                )}`}
                style={revealDelayStyle(360)}
              >
                {(bannerItems.length > 0 ? bannerItems : [null]).map((slide, index) => (
                  <button
                    key={slide?.id || `fallback-${index}`}
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
        </section>

        <section ref={infoRef} className={revealClass(infoVisible)}>
          {!infoShouldPrefetch ? (
            <div className="rounded-[26px] border border-emerald-100/70 bg-white/85 p-6 text-center shadow-sm backdrop-blur sm:p-8">
              <p className="text-sm font-medium text-slate-500">
                Cuộn xuống để chuẩn bị tải khối thông tin bệnh viện.
              </p>
            </div>
          ) : loadingInfo ? (
            <div className="rounded-[26px] border border-emerald-100/70 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 w-2/3 rounded-xl bg-emerald-100" />
                <div className="h-5 w-1/2 rounded-xl bg-emerald-100/90" />
                <div className="h-24 rounded-2xl bg-emerald-100/80" />
              </div>
            </div>
          ) : homeInfo ? (
            <div className="rounded-[26px] border border-emerald-100/70 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 p-5 shadow-[0_35px_95px_-45px_rgba(4,120,87,0.7)] sm:p-6 lg:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_520px] lg:items-start">
                <div
                  className={`min-w-0 lg:max-w-[760px] ${itemRevealClass(infoVisible, "left")}`}
                  style={revealDelayStyle(120)}
                >
                  <h2 className="text-2xl font-black leading-tight text-emerald-100 sm:text-3xl">
                    {homeInfo.title || "Thông tin bệnh viện"}
                  </h2>

                  {homeInfo.slogan && (
                    <p className="mt-2 text-lg font-semibold text-emerald-200 sm:text-xl">
                      {homeInfo.slogan}
                    </p>
                  )}

                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-emerald-50/95">
                    {homeInfo.description || "Nội dung thông tin đang được cập nhật."}
                  </p>
                </div>

                <div
                  className={`overflow-hidden rounded-3xl border border-emerald-300/30 bg-emerald-950/40 ${itemRevealClass(
                    infoVisible,
                    "right"
                  )}`}
                  style={revealDelayStyle(260)}
                >
                  {homeInfoImageUrl ? (
                    <img
                      src={homeInfoImageUrl}
                      alt={homeInfo.title || "Hospital info image"}
                      className="h-full max-h-[500px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex min-h-[340px] items-center justify-center text-sm font-semibold text-emerald-200/80">
                      Chưa có ảnh info
                    </div>
                  )}
                </div>
              </div>

              {homeInfoStats.length > 0 && (
                <div className="mt-6 grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  {homeInfoStats.map((item, index) => (
                    <div
                      key={item.id || `${item.label}-${item.value}`}
                      className={`px-4 py-2 ${itemRevealClass(infoVisible, "pop")} ${
                        index > 0 ? "border-l border-emerald-300/35" : ""
                      }`}
                      style={revealDelayStyle(220 + index * 90)}
                    >
                      <p className="text-3xl font-black leading-none text-emerald-100">
                        {item.value}
                      </p>
                      <p className="mt-2 text-sm font-medium leading-6 text-emerald-100/90">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[26px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm sm:p-8">
              Khối thông tin bệnh viện hiện chưa có dữ liệu.
            </div>
          )}
        </section>

        {message && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {message}
          </div>
        )}

        <section
          ref={postsRef}
          className={`grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_390px] ${revealClass(
            postsVisible
          )}`}
        >
          <div
            className={`min-w-0 rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_25px_55px_-45px_rgba(15,23,42,0.9)] sm:p-6 ${itemRevealClass(
              postsVisible,
              "left"
            )}`}
            style={revealDelayStyle(60)}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                Tin tức mới nhất
              </h2>
              <Link
                to="/tin-tuc"
                className="text-sm font-bold text-emerald-600 transition hover:text-emerald-700"
              >
                Xem tất cả
              </Link>
            </div>

            {!postsVisible ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                Cuộn tới khu vực này để chuẩn bị dữ liệu tin tức.
              </div>
            ) : pendingPosts ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                Đang tải dữ liệu tin tức...
              </div>
            ) : !featuredNews ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                Mục tin tức hiện chưa có bài viết.
              </div>
            ) : (
              <div className="space-y-5">
                <Link
                  to={`/${featuredNews.categorySlug}/${featuredNews.subcategorySlug}/${featuredNews.slug}`}
                  className={`group block overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 transition hover:border-orange-200 ${itemRevealClass(
                    postsVisible,
                    "left"
                  )}`}
                  style={revealDelayStyle(80)}
                >
                  <div className="aspect-[16/7] w-full overflow-hidden bg-slate-100">
                    {getPostThumbnail(featuredNews) ? (
                      <img
                        src={buildImageUrl(getPostThumbnail(featuredNews))}
                        alt={featuredNews.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                        Chưa có thumbnail
                      </div>
                    )}
                  </div>

                  <div className="p-4 sm:p-5">
                    <h3 className="text-xl font-black leading-tight text-slate-900 transition group-hover:text-emerald-600 sm:text-2xl">
                      {featuredNews.title}
                    </h3>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                      <span>{formatDateTime(featuredNews.create_at)}</span>
                      {featuredNews.views != null && (
                        <span>{featuredNews.views} lượt xem</span>
                      )}
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-600 sm:text-[15px]">
                      {getPostExcerpt(featuredNews)}
                    </p>
                  </div>
                </Link>

                <div className="divide-y divide-slate-200 rounded-[22px] border border-slate-200 bg-white">
                  {visibleNewsList.length === 0 ? (
                    <div className="px-5 py-6 text-sm text-slate-500">
                      Chưa có thêm bài viết tin tức nào khác.
                    </div>
                  ) : (
                    visibleNewsList.map((post, index) => {
                      const thumb = getPostThumbnail(post);

                      return (
                        <Link
                          key={`${post.id}-${post.slug}`}
                          to={`/${post.categorySlug}/${post.subcategorySlug}/${post.slug}`}
                          className={`group flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-slate-50 sm:px-5 ${itemRevealClass(
                            postsVisible,
                            index % 2 === 0 ? "left" : "right"
                          )}`}
                          style={revealDelayStyle(140 + index * 75)}
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="line-clamp-2 text-[15px] font-bold leading-6 text-slate-800 transition group-hover:text-emerald-600 sm:text-[16px]">
                              {post.title}
                            </h4>

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 sm:text-sm">
                              <span>{formatDateTime(post.create_at)}</span>
                              {post.views != null && <span>{post.views} lượt xem</span>}
                            </div>
                          </div>

                          <div className="hidden h-[64px] w-[98px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:block">
                            {thumb ? (
                              <img
                                src={buildImageUrl(thumb)}
                                alt={post.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-slate-400">
                                No image
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>

                {hasMoreNews && (
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={handleLoadMoreNews}
                      className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Xem thêm
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className={`space-y-6 ${itemRevealClass(postsVisible, "right")}`}>
            <div
              className={`rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_25px_55px_-45px_rgba(15,23,42,0.9)] sm:p-6 ${revealClass(
                postsVisible
              )}`}
              style={revealDelayStyle(120)}
            >
              <div className="mb-4">
                <h2 className="text-lg font-black text-slate-900 sm:text-xl">
                  Bài viết mới cập nhật
                </h2>
              </div>

              <div className="space-y-3">
                {!postsVisible ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                    Kéo xuống để tải danh sách bài viết.
                  </div>
                ) : pendingPosts ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                    Đang tải danh sách bài viết...
                  </div>
                ) : sidebarLatestPosts.length === 0 ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                    Chưa có bài viết để hiển thị.
                  </div>
                ) : (
                  sidebarLatestPosts.map((post, index) => (
                    <SidebarPostCard
                      key={`${post.id}-${post.slug}-latest`}
                      post={post}
                      shouldReveal={postsVisible}
                      delay={100 + index * 70}
                      direction="right"
                    />
                  ))
                )}
              </div>
            </div>

            <div
              className={`rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_25px_55px_-45px_rgba(15,23,42,0.9)] sm:p-6 ${revealClass(
                postsVisible
              )}`}
              style={revealDelayStyle(220)}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900 sm:text-xl">
                    Thông báo
                  </h2>
                </div>

                <Link
                  to="/thong-bao"
                  className="text-sm font-bold text-emerald-600 transition hover:text-emerald-700"
                >
                  Xem tất cả
                </Link>
              </div>

              <div className="space-y-3">
                {!postsVisible ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                    Kéo xuống để tải mục thông báo.
                  </div>
                ) : pendingPosts ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                    Đang tải thông báo...
                  </div>
                ) : sidebarAnnouncementPosts.length === 0 ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                    Chưa có bài thông báo để hiển thị.
                  </div>
                ) : (
                  sidebarAnnouncementPosts.map((post, index) => (
                    <SidebarPostCard
                      key={`${post.id}-${post.slug}-announcement`}
                      post={post}
                      compact
                      shouldReveal={postsVisible}
                      delay={120 + index * 70}
                      direction="right"
                    />
                  ))
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </section>
  );
}