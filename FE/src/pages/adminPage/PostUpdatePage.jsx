import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PostEditor from "@/components/PostEditor";
import ToastStack from "@/components/ToastStack";
import { getCategoriesApi } from "@/api/categoryApi";
import { getPostByIdApi, updatePostApi } from "@/api/postApi";

const API_ORIGIN =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, "") ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

function getBackendMessage(data, fallback = "Có lỗi xảy ra") {
  if (data?.message) return data.message;
  if (data?.error) return data.error;

  if (data?.errors) {
    const firstField = Object.keys(data.errors)[0];
    if (firstField && Array.isArray(data.errors[firstField])) {
      return data.errors[firstField][0];
    }
  }

  return fallback;
}

function toSlugPreview(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function findCategoryIdBySubcategoryId(categories, subcategoryId) {
  if (!subcategoryId) return "";

  for (const category of categories) {
    const found = (category.subcategories || []).find(
      (sub) => String(sub.id) === String(subcategoryId)
    );

    if (found) {
      return String(category.id);
    }
  }

  return "";
}

function normalizeHashtagToken(value = "") {
  const cleaned = value
    .replace(/^#+/, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .toLowerCase();

  return cleaned ? `#${cleaned}` : "";
}

function parseHashtags(value = "") {
  const tokens = value.split(/\s+/).filter(Boolean);
  const unique = [];

  for (const token of tokens) {
    const normalized = normalizeHashtagToken(token);
    if (normalized && !unique.includes(normalized)) {
      unique.push(normalized);
    }
  }

  return unique;
}

function formatHashtagValue(value = "") {
  return parseHashtags(value).join(" ");
}

function buildImageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}

export default function PostUpdatePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [isCategoryUnlocked, setIsCategoryUnlocked] = useState(false);
  const [isSubcategoryUnlocked, setIsSubcategoryUnlocked] = useState(false);
  const [hashtagInput, setHashtagInput] = useState("");

  const [form, setForm] = useState({
    title: "",
    hashtag: "",
    status: true,
    content: "",
  });

  const [postMeta, setPostMeta] = useState(null);

  const [existingThumbnail, setExistingThumbnail] = useState(null);
  const [newThumbnailFile, setNewThumbnailFile] = useState(null);
  const [newThumbnailPreview, setNewThumbnailPreview] = useState("");
  const [removeThumbnail, setRemoveThumbnail] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [redirectToastId, setRedirectToastId] = useState(null);
  const [isStatusUnlocked, setIsStatusUnlocked] = useState(false);

  const showPopup = useCallback((type, message, duration = 2000) => {
    const toastId = crypto.randomUUID();

    setToasts((prev) => [
      ...prev,
      {
        id: toastId,
        type,
        message,
        duration,
      },
    ]);

    return toastId;
  }, []);

  const removeToast = useCallback(
    (id) => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));

      if (id === redirectToastId) {
        setRedirectToastId(null);
        navigate("/post/list");
      }
    },
    [navigate, redirectToastId]
  );

  const slugPreview = useMemo(() => toSlugPreview(form.title), [form.title]);

  const subcategories = useMemo(() => {
    const category = categories.find(
      (c) => String(c.id) === String(selectedCategoryId)
    );
    return category?.subcategories || [];
  }, [categories, selectedCategoryId]);

  const selectedCategoryName = useMemo(
    () =>
      categories.find((c) => String(c.id) === String(selectedCategoryId))
        ?.name ||
      postMeta?.category?.name ||
      "—",
    [categories, selectedCategoryId, postMeta]
  );

  const selectedSubcategoryName = useMemo(
    () =>
      subcategories.find((s) => String(s.id) === String(selectedSubcategoryId))
        ?.name ||
      postMeta?.subcategory?.name ||
      "—",
    [subcategories, selectedSubcategoryId, postMeta]
  );

  const originalCategoryName = postMeta?.category?.name || "—";
  const originalSubcategoryName = postMeta?.subcategory?.name || "—";
  const originalStatusLabel = postMeta?.status ? "Đăng ngay" : "Lưu nháp";

  const hashtagList = useMemo(() => parseHashtags(form.hashtag), [form.hashtag]);

  const displayedThumbnailUrl = useMemo(() => {
    if (newThumbnailPreview) return newThumbnailPreview;
    if (!removeThumbnail && existingThumbnail?.file_path) {
      return buildImageUrl(existingThumbnail.file_path);
    }
    return "";
  }, [newThumbnailPreview, removeThumbnail, existingThumbnail]);

  const displayedThumbnailName = useMemo(() => {
    if (newThumbnailFile) return newThumbnailFile.name;
    if (!removeThumbnail && existingThumbnail?.original_name) {
      return existingThumbnail.original_name;
    }
    return "";
  }, [newThumbnailFile, removeThumbnail, existingThumbnail]);

  useEffect(() => {
    loadInitialData();
  }, [id]);

  useEffect(() => {
    return () => {
      if (newThumbnailPreview) {
        URL.revokeObjectURL(newThumbnailPreview);
      }
    };
  }, [newThumbnailPreview]);

  async function loadInitialData() {
    setLoading(true);

    try {
      const [categoryResult, postResult] = await Promise.all([
        getCategoriesApi({ includeInactive: true }),
        getPostByIdApi(id),
      ]);

      if (!categoryResult.ok) {
        showPopup(
          "error",
          getBackendMessage(categoryResult.data, "Không tải được category")
        );
        setLoading(false);
        return;
      }

      if (!postResult.ok) {
        showPopup(
          "error",
          getBackendMessage(postResult.data, "Không tải được bài viết")
        );
        setLoading(false);
        return;
      }

      const categoryList = categoryResult.data?.categories || [];
      const post = postResult.data;

      setCategories(categoryList);
      setPostMeta(post);
      setExistingThumbnail(post?.thumbnail || null);
      setNewThumbnailFile(null);
      setNewThumbnailPreview("");
      setRemoveThumbnail(false);

      const subcategoryId = post?.subcategory_id
        ? String(post.subcategory_id)
        : post?.subcategory?.id
        ? String(post.subcategory.id)
        : "";

      const categoryId = post?.category_id
        ? String(post.category_id)
        : post?.category?.id
        ? String(post.category.id)
        : findCategoryIdBySubcategoryId(categoryList, subcategoryId);

      setSelectedCategoryId(categoryId);
      setSelectedSubcategoryId(subcategoryId);

      setForm({
        title: post?.title || "",
        hashtag: formatHashtagValue(post?.hashtag || ""),
        status: post?.status ?? true,
        content: post?.content || "",
      });
    } catch (error) {
      showPopup("error", "Có lỗi xảy ra khi tải dữ liệu bài viết");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleCategoryChange(e) {
    const nextCategoryId = e.target.value;

    setSelectedCategoryId(nextCategoryId);
    setSelectedSubcategoryId("");
    setIsSubcategoryUnlocked(false);
  }

  function addHashtagToken(rawValue) {
    const normalized = normalizeHashtagToken(rawValue);
    if (!normalized) return;

    setForm((prev) => {
      const list = parseHashtags(prev.hashtag);
      if (!list.includes(normalized)) {
        list.push(normalized);
      }

      return {
        ...prev,
        hashtag: list.join(" "),
      };
    });
  }

  function removeHashtagToken(tokenToRemove) {
    setForm((prev) => ({
      ...prev,
      hashtag: parseHashtags(prev.hashtag)
        .filter((token) => token !== tokenToRemove)
        .join(" "),
    }));
  }

  function handleHashtagKeyDown(e) {
    if (e.key === " " || e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (hashtagInput.trim()) {
        addHashtagToken(hashtagInput);
        setHashtagInput("");
      }
      return;
    }

    if (e.key === "Backspace" && !hashtagInput && hashtagList.length > 0) {
      e.preventDefault();
      removeHashtagToken(hashtagList[hashtagList.length - 1]);
    }
  }

  function handleHashtagBlur() {
    if (!hashtagInput.trim()) return;
    addHashtagToken(hashtagInput);
    setHashtagInput("");
  }

  function handleThumbnailChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showPopup("error", "Thumbnail phải là file ảnh hợp lệ");
      return;
    }

    if (newThumbnailPreview) {
      URL.revokeObjectURL(newThumbnailPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setNewThumbnailFile(file);
    setNewThumbnailPreview(previewUrl);
    setRemoveThumbnail(false);
  }

  function handleRemoveThumbnail() {
    if (newThumbnailPreview) {
      URL.revokeObjectURL(newThumbnailPreview);
    }

    if (newThumbnailFile) {
      setNewThumbnailFile(null);
      setNewThumbnailPreview("");
      return;
    }

    if (existingThumbnail) {
      setRemoveThumbnail(true);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setRedirectToastId(null);

    if (!selectedSubcategoryId) {
      showPopup("error", "Vui lòng chọn subcategory trước khi cập nhật bài viết");
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title.trim());
    formData.append("hashtag", formatHashtagValue(form.hashtag));
    formData.append("status", String(form.status));
    formData.append("content", form.content);
    formData.append("subcategory_id", String(selectedSubcategoryId));

    if (newThumbnailFile) {
      formData.append("thumbnail", newThumbnailFile);
    }

    if (removeThumbnail && !newThumbnailFile) {
      formData.append("remove_thumbnail", "true");
    }

    setSubmitting(true);

    try {
      const result = await updatePostApi(id, formData);

      if (!result.ok) {
        showPopup(
          "error",
          getBackendMessage(result.data, "Cập nhật bài viết thất bại")
        );
        setSubmitting(false);
        return;
      }

      const successToastId = showPopup(
        "success",
        getBackendMessage(result.data, "Cập nhật bài viết thành công")
      );
      setRedirectToastId(successToastId);

      const updatedPost = result.data?.post;
      if (updatedPost) {
        setPostMeta(updatedPost);
        setExistingThumbnail(updatedPost.thumbnail || null);
        setRemoveThumbnail(false);

        if (newThumbnailPreview) {
          URL.revokeObjectURL(newThumbnailPreview);
        }
        setNewThumbnailFile(null);
        setNewThumbnailPreview("");

        const updatedSubcategoryId = updatedPost?.subcategory_id
          ? String(updatedPost.subcategory_id)
          : selectedSubcategoryId;

        const updatedCategoryId = updatedPost?.category?.id
          ? String(updatedPost.category.id)
          : findCategoryIdBySubcategoryId(categories, updatedSubcategoryId);

        setSelectedCategoryId(updatedCategoryId || selectedCategoryId);
        setSelectedSubcategoryId(updatedSubcategoryId || selectedSubcategoryId);

        setForm({
          title: updatedPost.title || "",
          hashtag: formatHashtagValue(updatedPost.hashtag || ""),
          status: updatedPost.status ?? true,
          content: updatedPost.content || "",
        });
      }
    } catch (error) {
      showPopup("error", "Có lỗi xảy ra khi cập nhật bài viết");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-100 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-amber-100 blur-2xl" />
        <div className="relative py-12 text-center text-slate-500">
          Đang tải chi tiết bài viết...
        </div>
      </section>
    );
  }

  return (
    <section className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70 sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-100 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-amber-100 blur-2xl" />

      <div className="relative mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Cập nhật bài viết
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Chỉnh sửa nội dung bài viết, thay đổi chuyên mục, thumbnail và cập
            nhật trạng thái hiển thị.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Tiêu đề bài viết
                </label>
                <input
                  id="title"
                  name="title"
                  placeholder="Nhập tiêu đề rõ ràng, dễ tìm kiếm"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="slug-preview"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Slug preview
                </label>

                <div
                  id="slug-preview"
                  className="flex min-h-[46px] items-center rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900"
                >
                  <p className="break-all text-sm font-bold text-cyan-700">
                    /{slugPreview || "slug-se-duoc-tao-tu-dong"}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="hashtag"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Hashtag
              </label>
              <div className="flex min-h-[46px] flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 transition focus-within:border-cyan-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-100">
                {hashtagList.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeHashtagToken(tag)}
                      className="text-cyan-700/80 transition hover:text-cyan-900"
                      aria-label={`Xóa ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  id="hashtag"
                  name="hashtag"
                  placeholder={
                    hashtagList.length === 0
                      ? "Gõ hashtag rồi bấm Space (ví dụ: gioithieu)"
                      : "Thêm hashtag..."
                  }
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={handleHashtagKeyDown}
                  onBlur={handleHashtagBlur}
                  className="min-w-[160px] flex-1 bg-transparent text-sm text-slate-900 outline-none"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Space/Enter để tạo tag tự động dạng #hashtag.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label
                  htmlFor="status"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  Trạng thái

                  <button
                    type="button"
                    onClick={() => setIsStatusUnlocked((prev) => !prev)}
                    title={
                      isStatusUnlocked ? "Khóa trạng thái" : "Mở khóa trạng thái"
                    }
                    aria-label={
                      isStatusUnlocked ? "Khóa trạng thái" : "Mở khóa trạng thái"
                    }
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
                      isStatusUnlocked
                        ? "border-cyan-300 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                        : "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {isStatusUnlocked ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-4 w-4"
                      >
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 1 1 8 0" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-4 w-4"
                      >
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                      </svg>
                    )}
                  </button>
                </label>

                <select
                  id="status"
                  name="status"
                  value={form.status ? "active" : "inactive"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value === "active",
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={!isStatusUnlocked}
                >
                  <option value="active">Đăng ngay</option>
                  <option value="inactive">Lưu nháp</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  Category

                  <button
                    type="button"
                    onClick={() => setIsCategoryUnlocked((prev) => !prev)}
                    title={isCategoryUnlocked ? "Khóa category" : "Mở khóa category"}
                    aria-label={
                      isCategoryUnlocked ? "Khóa category" : "Mở khóa category"
                    }
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
                      isCategoryUnlocked
                        ? "border-cyan-300 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                        : "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {isCategoryUnlocked ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-4 w-4"
                      >
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 1 1 8 0" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-4 w-4"
                      >
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                      </svg>
                    )}
                  </button>
                </label>

                <select
                  id="category"
                  value={selectedCategoryId}
                  onChange={handleCategoryChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-70"
                  required
                  disabled={!isCategoryUnlocked}
                >
                  <option value="">Chọn category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="subcategory"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  Subcategory

                  <button
                    type="button"
                    onClick={() => setIsSubcategoryUnlocked((prev) => !prev)}
                    title={
                      isSubcategoryUnlocked
                        ? "Khóa subcategory"
                        : "Mở khóa subcategory"
                    }
                    aria-label={
                      isSubcategoryUnlocked
                        ? "Khóa subcategory"
                        : "Mở khóa subcategory"
                    }
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
                      isSubcategoryUnlocked
                        ? "border-cyan-300 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                        : "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {isSubcategoryUnlocked ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-4 w-4"
                      >
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 1 1 8 0" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-4 w-4"
                      >
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                      </svg>
                    )}
                  </button>
                </label>

                <select
                  id="subcategory"
                  value={selectedSubcategoryId}
                  onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-70"
                  required
                  disabled={!selectedCategoryId || !isSubcategoryUnlocked}
                >
                  <option value="">Chọn subcategory</option>
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Thumbnail bài viết
              </label>

              <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4">
                {displayedThumbnailUrl ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <img
                        src={displayedThumbnailUrl}
                        alt="Thumbnail preview"
                        className="h-64 w-full object-cover"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">
                        {newThumbnailFile
                          ? "Ảnh mới đang chọn"
                          : removeThumbnail
                          ? "Thumbnail sẽ bị xóa"
                          : "Thumbnail hiện tại"}
                      </p>
                      <p className="mt-1 break-all text-slate-600">
                        {displayedThumbnailName || "—"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                    {removeThumbnail
                      ? "Thumbnail cũ sẽ bị xóa sau khi lưu thay đổi."
                      : "Bài viết hiện chưa có thumbnail."}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer items-center rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700">
                    {displayedThumbnailUrl ? "Chọn thumbnail mới" : "Tải thumbnail lên"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="hidden"
                    />
                  </label>

                  {(displayedThumbnailUrl || removeThumbnail) && (
                    <button
                      type="button"
                      onClick={handleRemoveThumbnail}
                      className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      {newThumbnailFile ? "Bỏ ảnh mới" : "Xóa thumbnail hiện tại"}
                    </button>
                  )}
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Hỗ trợ ảnh jpg, jpeg, png, webp, gif.
                </p>
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5 xl:sticky xl:top-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Cài đặt hiện tại
            </p>

            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Tác giả
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {postMeta?.author?.username || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Trạng thái
                </p>
                <p className="mt-1 text-slate-700">
                  Hiện tại: {originalStatusLabel}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Category
                </p>
                <p className="mt-1 text-slate-700">
                  Category hiện tại: {originalCategoryName}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Subcategory
                </p>
                <p className="mt-1 text-slate-700">
                  Subcategory hiện tại: {originalSubcategoryName}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Hashtag
                </p>
                <p className="mt-1 text-slate-700">
                  Tổng hashtag:
                  <span className="ml-2 font-semibold text-slate-900">
                    {hashtagList.length}
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Thumbnail
                </p>
                <p className="mt-1 text-slate-700">
                  {newThumbnailFile
                    ? "Đang chọn thumbnail mới"
                    : removeThumbnail
                    ? "Sẽ xóa thumbnail khi lưu"
                    : existingThumbnail
                    ? "Đang giữ thumbnail cũ"
                    : "Chưa có thumbnail"}
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Nội dung bài viết
          </label>
          <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
            <PostEditor
              value={form.content}
              onChange={(content) =>
                setForm((prev) => ({
                  ...prev,
                  content,
                }))
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => navigate("/post/list")}
            disabled={submitting}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Quay lại
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang cập nhật..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>

      <ToastStack toasts={toasts} removeToast={removeToast} />
    </section>
  );
}