import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { updateCategoryApi, getCategoryByIdApi } from "@/api/categoryApi";
import { toSlugPreview } from "@/utils/slugPreview";
import ToastStack from "@/components/ToastStack";

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

export default function CategoryUpdatePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: true,
  });

  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const slugPreview = useMemo(() => toSlugPreview(form.name), [form.name]);

  useEffect(() => {
    loadCategory();
  }, []);

  async function loadCategory() {
    setLoading(true);

    const result = await getCategoryByIdApi(id);

    if (!result.ok) {
      showPopup("error", getBackendMessage(result.data, "Không thể tải danh mục"));
      setLoading(false);
      return;
    }

    setForm({
      name: result.data.name || "",
      description: result.data.description || "",
      status: result.data.status,
    });

    setLoading(false);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const result = await updateCategoryApi(id, form);

    if (!result.ok) {
      showPopup("error", getBackendMessage(result.data, "Cập nhật thất bại"));
      return;
    }

    showPopup("success", getBackendMessage(result.data, "Danh mục đã được cập nhật thành công"));
    setTimeout(() => {
      navigate("/category/list");
    }, 2000);
  }

  return (
    <section className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70 sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-100 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-amber-100 blur-2xl" />

      <div className="relative mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Cập nhật danh mục
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Chỉnh sửa thông tin danh mục và thay đổi trạng thái hiển thị.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-6">
        <div className="grid gap-5 md:grid-cols-[280px_minmax(0,1fr)]">
          <div className="md:col-span-2">
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Tên danh mục
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ex: Tuyển dụng, Sự kiện, Hướng dẫn..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              required
              disabled={loading}
            />
          </div>

          <div className="md:col-span-2">
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
              Khi đổi tên danh mục, backend sẽ tự sinh lại slug mới và tự xử lý chống trùng.
            </p>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Mô tả ý nghĩa danh mục
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Mô tả ngắn gọn về danh mục này"
              className="w-full resize-y rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              disabled={loading}
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
              className="w-64 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              disabled={loading}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Cài đặt hiện tại
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Danh mục sẽ có trạng thái
              <span
                className={`ml-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                  form.status
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {form.status ? "Active" : "Inactive"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => navigate("/category/list")}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Trở về danh sách
          </button>
          <button
            type="submit"
            className="rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-400"
            disabled={loading}
          >
            {loading ? "Đang tải dữ liệu..." : "Lưu cập nhật"}
          </button>
        </div>
      </form>

      <ToastStack toasts={toasts} removeToast={removeToast} />
    </section>
  );
}