import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createSubCategoryApi } from "../api/subcategoryApi";
import { toSlugPreview } from "../utils/slugPreview";

const API_BASE = "http://localhost:5000/api";

export default function SubCategoryCreatePage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
    status: true,
    thumbnail: null,
  });

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
    try {
      setLoadingCategories(true);

      const res = await fetch(`${API_BASE}/categories`);
      const data = await res.json();

      setCategories(data.categories || []);
    } catch {
      setMessage("Không tải được danh sách category");
    } finally {
      setLoadingCategories(false);
    }
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

    if (!form.name.trim()) {
      setMessage("Tên subcategory là bắt buộc");
      return;
    }

    if (!form.category_id) {
      setMessage("Vui lòng chọn category");
      return;
    }

    try {
      setSubmitting(true);

      const result = await createSubCategoryApi({
        name: form.name.trim(),
        description: form.description,
        category_id: form.category_id,
        status: form.status,
        thumbnail: form.thumbnail,
      });

      if (!result.ok) {
        setMessage(result.data?.error || "Create failed");
        return;
      }

      navigate("/subcategory/list");
    } catch {
      setMessage("Có lỗi xảy ra khi tạo subcategory");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-6 py-5 sm:px-8">
          <h2 className="text-2xl font-bold text-zinc-800">
            Tạo SubCategory
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Thêm subcategory mới và upload thumbnail đại diện.
          </p>
        </div>

        <div className="px-6 py-6 sm:px-8">
          {message && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {message}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
          >
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                  Tên subcategory
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Nhập tên subcategory"
                  className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                  Slug tự động
                </label>
                <input
                  value={slugPreview || "slug-se-duoc-tao-tu-dong"}
                  readOnly
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm text-zinc-500 outline-none"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  Slug được tạo từ tên subcategory. Backend sẽ tự xử lý slug cuối
                  cùng và chống trùng.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Nhập mô tả ngắn cho subcategory"
                  className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                  Category cha
                </label>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  disabled={loadingCategories}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                  required
                >
                  <option value="">
                    {loadingCategories ? "Đang tải..." : "Chọn category"}
                  </option>

                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <input
                  type="checkbox"
                  name="status"
                  checked={form.status}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <span className="text-sm font-medium text-zinc-700">
                  Kích hoạt subcategory
                </span>
              </label>
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-5">
                <label className="mb-3 block text-sm font-semibold text-zinc-700">
                  Thumbnail
                </label>

                <input
                  type="file"
                  name="thumbnail"
                  accept="image/*"
                  onChange={handleChange}
                  className="
                    block w-full text-sm text-zinc-600
                    file:mr-4 file:rounded-2xl file:border-0
                    file:bg-blue-600 file:px-4 file:py-3
                    file:text-sm file:font-semibold file:text-white
                    hover:file:bg-blue-700
                  "
                />

                <p className="mt-3 text-xs text-zinc-500">
                  Nên dùng ảnh ngang, rõ nét, dung lượng vừa phải để hiển thị đẹp
                  ở trang category.
                </p>

                {form.thumbnail && (
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="mt-4 rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                  >
                    Xóa ảnh đã chọn
                  </button>
                )}
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-5">
                <p className="mb-3 text-sm font-semibold text-zinc-700">
                  Xem trước thumbnail
                </p>

                <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Thumbnail preview"
                      className="h-full max-h-[320px] w-full object-cover"
                    />
                  ) : (
                    <div className="px-6 text-center text-sm text-zinc-400">
                      Chưa có ảnh thumbnail nào được chọn
                    </div>
                  )}
                </div>

                {form.thumbnail && (
                  <div className="mt-3 text-sm text-zinc-600">
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

            <div className="lg:col-span-2 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Đang tạo..." : "Create"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/subcategory/list")}
                className="rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
              >
                Quay lại danh sách
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}