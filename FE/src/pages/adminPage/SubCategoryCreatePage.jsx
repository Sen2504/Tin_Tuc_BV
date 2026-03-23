import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCategoriesApi } from "@/api/categoryApi";
import { createSubCategoryApi } from "@/api/subcategoryApi";
import { toSlugPreview } from "@/utils/slugPreview";

export default function SubCategoryCreatePage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
    status: true,
    thumbnail: null,
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const slugPreview = useMemo(() => toSlugPreview(form.name), [form.name]);

  const previewUrl = useMemo(() => {
    if (!form.thumbnail) return "";
    return URL.createObjectURL(form.thumbnail);
  }, [form.thumbnail]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function loadCategories() {
    setLoadingCategories(true);
    setMessage("");

    const result = await getCategoriesApi();

    if (!result.ok) {
      setIsError(true);
      setMessage(result.data?.error || "Không tải được category");
      setLoadingCategories(false);
      return;
    }

    setCategories(result.data?.categories || []);
    setLoadingCategories(false);
  }

  function handleChange(e) {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      setForm((prev) => ({
        ...prev,
        [name]: files && files[0] ? files[0] : null,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleRemoveThumbnail() {
    setForm((prev) => ({
      ...prev,
      thumbnail: null,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!form.name.trim()) {
      setIsError(true);
      setMessage("Tên danh mục con là bắt buộc");
      return;
    }

    if (!form.category_id) {
      setIsError(true);
      setMessage("Vui lòng chọn category");
      return;
    }

    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category_id: Number(form.category_id),
      status: form.status,
      thumbnail: form.thumbnail,
    };

    const result = await createSubCategoryApi(payload);

    if (!result.ok) {
      setIsError(true);
      setMessage(result.data?.error || "Tạo danh mục con thất bại");
      setSubmitting(false);
      return;
    }

    setIsError(false);
    setMessage(result.data?.message || "Tạo danh mục con thành công");

    navigate("/subcategory/list");
  }

  return (
    <section className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70 sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-100 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-amber-100 blur-2xl" />

      <div className="relative mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Tạo danh mục con mới
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Chọn danh mục cha, nhập thông tin mô tả và upload thumbnail đại diện
            cho danh mục con.
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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <div>
              <label
                htmlFor="category_id"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Category cha
              </label>
              <select
                id="category_id"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                disabled={loadingCategories}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                required
              >
                <option value="">
                  {loadingCategories ? "Đang tải category..." : "Chọn category"}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Tên danh mục con
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nhập tên danh mục con"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="slugPreview"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Slug tự động
              </label>
              <input
                id="slugPreview"
                value={slugPreview || "slug-se-duoc-tao-tu-dong"}
                readOnly
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-slate-500 outline-none"
              />
              <p className="mt-2 text-xs text-slate-500">
                Slug được tạo từ tên danh mục con. Backend sẽ tự xử lý slug cuối
                cùng và chống trùng.
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Mô tả
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={6}
                placeholder="Nhập mô tả ngắn cho danh mục con (không bắt buộc)"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <div>
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
                <option value="active">Kích hoạt</option>
                <option value="inactive">Ẩn / chưa kích hoạt</option>
              </select>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <label className="mb-3 block text-sm font-semibold text-slate-700">
                Thumbnail
              </label>

              <input
                type="file"
                name="thumbnail"
                accept="image/*"
                onChange={handleChange}
                className="
                  block w-full text-sm text-slate-600
                  file:mr-4 file:rounded-xl file:border-0
                  file:bg-cyan-600 file:px-4 file:py-2.5
                  file:text-sm file:font-semibold file:text-white
                  hover:file:bg-cyan-700
                "
              />

              <p className="mt-3 text-xs text-slate-500">
                Nên dùng ảnh ngang, rõ nét, dung lượng vừa phải để hiển thị đẹp.
              </p>

              {form.thumbnail && (
                <button
                  type="button"
                  onClick={handleRemoveThumbnail}
                  className="mt-4 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Xóa ảnh đã chọn
                </button>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Xem trước thumbnail
              </p>

              <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Thumbnail preview"
                    className="h-full max-h-[320px] w-full object-cover"
                  />
                ) : (
                  <div className="px-6 text-center text-sm text-slate-400">
                    Chưa có ảnh thumbnail nào được chọn
                  </div>
                )}
              </div>

              {form.thumbnail && (
                <div className="mt-3 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold">Tên file:</span>{" "}
                    {form.thumbnail.name}
                  </p>
                  <p>
                    <span className="font-semibold">Dung lượng:</span>{" "}
                    {(form.thumbnail.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Cài đặt hiện tại
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Danh mục con sẽ được tạo với trạng thái
                <span
                  className={`ml-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    form.status
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {form.status ? "Kích hoạt" : "Ẩn"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => navigate("/subcategory/list")}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Quay lại
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang tạo..." : "Tạo danh mục con"}
          </button>
        </div>
      </form>
    </section>
  );
}