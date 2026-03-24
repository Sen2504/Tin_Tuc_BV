import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  updateSubCategoryApi,
  getSubCategoryByIdApi,
} from "@/api/subcategoryApi";
import { getCategoriesApi } from "@/api/categoryApi";
import ToastStack from "@/components/ToastStack";
import { toSlugPreview } from "@/utils/slugPreview";

const API_ORIGIN = "http://localhost:5000";

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

export default function SubCategoryUpdatePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [categories, setCategories] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentThumbnail, setCurrentThumbnail] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
    status: true,
    thumbnail: null,
    remove_thumbnail: false,
  });

  const slugPreview = useMemo(() => toSlugPreview(form.name), [form.name]);

  const previewUrl = useMemo(() => {
    if (!form.thumbnail) return "";
    return URL.createObjectURL(form.thumbnail);
  }, [form.thumbnail]);

  const showPopup = useCallback((type, message, duration = 2000) => {
    setToasts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type,
        message,
        duration,
      },
    ]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function loadInitialData() {
    await Promise.all([loadCategories(), loadSubCategory()]);
  }

  async function loadCategories() {
    try {
      setLoadingCategories(true);

      const result = await getCategoriesApi();

      if (!result.ok) {
        showPopup(
          "error",
          getBackendMessage(result.data, "Không tải được danh sách category")
        );
        return;
      }

      setCategories(result.data?.categories || []);
    } catch {
      showPopup("error", "Không tải được danh sách category");
    } finally {
      setLoadingCategories(false);
    }
  }

  async function loadSubCategory() {
    try {
      setLoading(true);

      const result = await getSubCategoryByIdApi(id);

      if (!result.ok) {
        showPopup(
          "error",
          getBackendMessage(result.data, "Không tải được thông tin subcategory")
        );
        return;
      }

      const subcategory = result.data;

      setForm({
        name: subcategory.name || "",
        description: subcategory.description || "",
        category_id: subcategory.category_id
          ? String(subcategory.category_id)
          : "",
        status: !!subcategory.status,
        thumbnail: null,
        remove_thumbnail: false,
      });

      setCurrentThumbnail(subcategory.thumbnail || null);
    } catch {
      showPopup("error", "Không tải được thông tin subcategory");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const selectedFile = files && files[0] ? files[0] : null;

      setForm((prev) => ({
        ...prev,
        [name]: selectedFile,
        remove_thumbnail: false,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleRemoveSelectedThumbnail() {
    setForm((prev) => ({
      ...prev,
      thumbnail: null,
    }));
  }

  function handleRemoveCurrentThumbnail() {
    setCurrentThumbnail(null);

    setForm((prev) => ({
      ...prev,
      thumbnail: null,
      remove_thumbnail: true,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSubmitting(true);

      const result = await updateSubCategoryApi(id, {
        name: form.name.trim(),
        description: form.description.trim(),
        category_id: Number(form.category_id),
        status: form.status,
        remove_thumbnail: form.remove_thumbnail,
        thumbnail: form.thumbnail,
      });

      if (!result.ok) {
        showPopup("error", getBackendMessage(result.data, "Cập nhật subcategory thất bại"));
        return;
      }

      showPopup("success", getBackendMessage(result.data, "Cập nhật subcategory thành công"));

      setTimeout(() => {
        navigate("/subcategory/list");
      }, 2000);
    } catch {
      showPopup("error", "Có lỗi xảy ra khi cập nhật subcategory");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70 sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-100 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-amber-100 blur-2xl" />

      <div className="relative mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Cập nhật danh mục con
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Chỉnh sửa thông tin danh mục con, thay đổi category cha và cập nhật
            thumbnail nếu cần.
          </p>
        </div>
      </div>

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
                disabled={loading || loadingCategories}
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
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-slate-500 outline-none"
              />
              <p className="mt-2 text-xs text-slate-500">
                Khi đổi tên danh mục con, backend sẽ tự sinh lại slug mới và tự
                xử lý chống trùng.
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
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="active">Kích hoạt</option>
                <option value="inactive">Ẩn / chưa kích hoạt</option>
              </select>
            </div>
            <div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Cài đặt hiện tại
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Danh mục con sẽ được lưu với trạng thái
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

          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Thumbnail hiện tại
              </p>

              <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {currentThumbnail && !form.remove_thumbnail ? (
                  <img
                    src={`${API_ORIGIN}${currentThumbnail.file_path}`}
                    alt="Current thumbnail"
                    className="h-full max-h-[320px] w-full object-cover"
                  />
                ) : (
                  <div className="px-6 text-center text-sm text-slate-400">
                    Chưa có thumbnail hiện tại
                  </div>
                )}
              </div>

              {currentThumbnail && !form.remove_thumbnail && (
                <button
                  type="button"
                  onClick={handleRemoveCurrentThumbnail}
                  className="mt-4 rounded-xl border border-rose-300 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  Xóa thumbnail hiện tại
                </button>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <label className="mb-3 block text-sm font-semibold text-slate-700">
                Thumbnail mới
              </label>

              <input
                type="file"
                name="thumbnail"
                accept="image/*"
                onChange={handleChange}
                disabled={loading}
                className="
                  block w-full text-sm text-slate-600
                  file:mr-4 file:rounded-xl file:border-0
                  file:bg-cyan-600 file:px-4 file:py-2.5
                  file:text-sm file:font-semibold file:text-white
                  hover:file:bg-cyan-700 disabled:cursor-not-allowed
                "
              />

              <p className="mt-3 text-xs text-slate-500">
                Nếu chọn ảnh mới, ảnh này sẽ thay cho thumbnail hiện tại.
              </p>

              {form.thumbnail && (
                <button
                  type="button"
                  onClick={handleRemoveSelectedThumbnail}
                  className="mt-4 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Xóa ảnh mới đã chọn
                </button>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Xem trước thumbnail mới
              </p>

              <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="New thumbnail preview"
                    className="h-full max-h-[320px] w-full object-cover"
                  />
                ) : (
                  <div className="px-6 text-center text-sm text-slate-400">
                    Chưa chọn thumbnail mới
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
            disabled={loading || submitting}
            className="rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang cập nhật..." : "Lưu cập nhật"}
          </button>
        </div>
      </form>

      <ToastStack toasts={toasts} removeToast={removeToast} />
    </section>
  );
}