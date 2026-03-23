import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PostEditor from "../../components/PostEditor";
import { getCategoriesApi } from "@/api/categoryApi";
import { createPostApi } from "@/api/postApi";
import { toSlugPreview } from "@/utils/slugPreview";

function normalizeHashtag(rawValue = "") {
  const slug = toSlugPreview(rawValue.replace(/^#+/, ""));
  return slug || "";
}

function parseHashtagString(value = "") {
  const parts = value
    .split(/[\s,]+/)
    .map((item) => normalizeHashtag(item))
    .filter(Boolean);

  return [...new Set(parts)];
}

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState([]);

  const [form, setForm] = useState({
    title: "",
    hashtag: "",
    status: true,
    content: "",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const slugPreview = useMemo(() => toSlugPreview(form.title), [form.title]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setHashtags(parseHashtagString(form.hashtag));
  }, [form.hashtag]);

  async function loadCategories() {
    const result = await getCategoriesApi();

    if (!result.ok) {
      setIsError(true);
      setMessage(result.data?.error || "Không tải được category");
      return;
    }

    setCategories(result.data.categories || []);
  }

  const subcategories = useMemo(() => {
    const category = categories.find(
      (c) => String(c.id) === String(selectedCategoryId)
    );
    return category?.subcategories || [];
  }, [categories, selectedCategoryId]);

  const selectedCategory = useMemo(
    () => categories.find((c) => String(c.id) === String(selectedCategoryId)),
    [categories, selectedCategoryId]
  );

  const selectedSubcategory = useMemo(
    () => subcategories.find((s) => String(s.id) === String(selectedSubcategoryId)),
    [subcategories, selectedSubcategoryId]
  );

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  function handleAddHashtag(rawValue) {
    const token = normalizeHashtag(rawValue);
    if (!token) return;

    setHashtags((prev) => {
      if (prev.includes(token)) {
        return prev;
      }

      const next = [...prev, token];
      setForm((oldForm) => ({
        ...oldForm,
        hashtag: next.join(" "),
      }));
      return next;
    });
  }

  function handleHashtagKeyDown(event) {
    if (event.key === " " || event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      handleAddHashtag(hashtagInput);
      setHashtagInput("");
      return;
    }

    if (event.key === "Backspace" && !hashtagInput.trim() && hashtags.length > 0) {
      event.preventDefault();

      setHashtags((prev) => {
        const next = prev.slice(0, -1);
        setForm((oldForm) => ({
          ...oldForm,
          hashtag: next.join(" "),
        }));
        return next;
      });
    }
  }

  function handleRemoveHashtag(tagToRemove) {
    setHashtags((prev) => {
      const next = prev.filter((tag) => tag !== tagToRemove);
      setForm((oldForm) => ({
        ...oldForm,
        hashtag: next.join(" "),
      }));
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!selectedSubcategoryId) {
      setIsError(true);
      setMessage("Vui lòng chọn subcategory trước khi tạo bài viết");
      return;
    }

    const payload = {
      title: form.title,
      hashtag: form.hashtag,
      status: form.status,
      content: form.content,
      subcategory_id: Number(selectedSubcategoryId),
    };

    const result = await createPostApi(payload);

    if (!result.ok) {
      setIsError(true);
      setMessage(result.data?.error || "Tạo bài viết thất bại");
      return;
    }

    setIsError(false);
    setMessage(result.data?.message || "Tạo bài viết thành công");
  }

  return (
    <section className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70 sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-100 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-amber-100 blur-2xl" />

      <div className="relative mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Tạo bài viết mới
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Chọn chuyên mục phù hợp, nhập nội dung và thiết lập trạng thái trước
            khi đăng bài.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`relative mb-6 rounded-xl border px-4 py-3 text-sm ${
            isError
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative space-y-6">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Category
            </label>
            <select
              id="category"
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setSelectedSubcategoryId("");
              }}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              required
            >
              <option value="">Chọn category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <label
              htmlFor="subcategory"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Subcategory
            </label>
            <select
              id="subcategory"
              value={selectedSubcategoryId}
              onChange={(e) => setSelectedSubcategoryId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              required
              disabled={!selectedCategoryId}
            >
              <option value="">Chọn subcategory</option>
              {subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Trạng thái
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
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
            >
              <option value="active">Đăng ngay</option>
              <option value="inactive">Lưu nháp</option>
            </select>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Cài đặt hiện tại
            </p>
            <div className="mt-2 space-y-1 text-sm text-slate-700">
              <p>
                Category: <span className="font-semibold text-slate-900">{selectedCategory?.name || "Chưa chọn"}</span>
              </p>
              <p>
                Subcategory: <span className="font-semibold text-slate-900">{selectedSubcategory?.name || "Chưa chọn"}</span>
              </p>
              <p>
                Trạng thái:
                <span
                  className={`ml-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    form.status
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {form.status ? "Đăng ngay" : "Lưu nháp"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
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

          <div className="lg:col-span-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Preview slug
            </label>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
              {slugPreview || "slug-se-hien-thi-o-day"}
            </div>
          </div>

          <div className="lg:col-span-12">
            <label
              htmlFor="hashtag"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Hashtag
            </label>
            <div className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 transition focus-within:border-cyan-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-100">
              <div className="flex flex-wrap items-center gap-2">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-800"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveHashtag(tag)}
                      className="rounded-full px-1 text-cyan-700 transition hover:bg-cyan-200"
                      aria-label={`Xóa #${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}

                <input
                  id="hashtag"
                  value={hashtagInput}
                  onChange={(event) => setHashtagInput(event.target.value)}
                  onKeyDown={handleHashtagKeyDown}
                  onBlur={() => {
                    handleAddHashtag(hashtagInput);
                    setHashtagInput("");
                  }}
                  placeholder="Nhập hashtag rồi nhấn space (vd: gioithieu)"
                  className="min-w-[260px] flex-1 bg-transparent py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Mỗi lần nhấn phím space, hashtag sẽ tự chuẩn hóa slug và hiển thị dạng #ten-tag.
            </p>
          </div>

          <div className="lg:col-span-12">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Nội dung bài viết
            </label>
            <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
              <PostEditor
                value={form.content}
                onChange={(content) => setForm((prev) => ({ ...prev, content }))}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Quay lại
          </button>
          <button
            type="submit"
            className="rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            Tạo bài viết
          </button>
        </div>
      </form>
    </section>
  );
}