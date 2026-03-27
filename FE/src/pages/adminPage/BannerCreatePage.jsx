import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBannerApi } from "@/api/bannerApi";
import { createBannerItemApi } from "@/api/bannerItemApi";

const initialBannerForm = {
  status: true,
};

const createEmptyItem = (sortOrder = 0) => ({
  image: null,
  preview: "",
  url: "",
  sort_order: sortOrder,
  status: true,
});

export default function BannerCreatePage() {
  const navigate = useNavigate();

  const [bannerForm, setBannerForm] = useState(initialBannerForm);
  const [items, setItems] = useState([createEmptyItem(0)]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeCount = useMemo(
    () => items.filter((item) => item.status).length,
    [items]
  );

  function handleBannerChange(e) {
    const { name, value, type, checked } = e.target;

    setBannerForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleItemChange(index, e) {
    const { name, value, type, checked, files } = e.target;

    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        if (type === "file") {
          const file = files?.[0] || null;
          return {
            ...item,
            image: file,
            preview: file ? URL.createObjectURL(file) : "",
          };
        }

        return {
          ...item,
          [name]:
            type === "checkbox"
              ? checked
              : name === "sort_order"
              ? value === ""
                ? ""
                : Number(value)
              : value,
        };
      })
    );
  }

  function addItem() {
    setItems((prev) => [...prev, createEmptyItem(prev.length)]);
  }

  function removeItem(index) {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (items.length === 0) {
      setErrorMessage("Phải có ít nhất 1 banner item");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].image) {
        setErrorMessage(`Banner item ${i + 1} chưa chọn ảnh`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const bannerPayload = {
        status: bannerForm.status,
      };

      const bannerRes = await createBannerApi(bannerPayload);

      if (!bannerRes.ok) {
        setErrorMessage(
          bannerRes.data?.error ||
            bannerRes.data?.message ||
            "Tạo banner thất bại"
        );
        setSubmitting(false);
        return;
      }

      const createdBanner = bannerRes.data?.banner;
      const bannerId = createdBanner?.id;

      if (!bannerId) {
        setErrorMessage("Không lấy được ID banner sau khi tạo");
        setSubmitting(false);
        return;
      }

      for (const item of items) {
        const formData = new FormData();
        formData.append("banner_id", bannerId);
        formData.append("sort_order", item.sort_order ?? 0);
        formData.append("status", item.status);

        if (item.image) {
          formData.append("image", item.image);
        }

        const itemRes = await createBannerItemApi(formData);

        if (!itemRes.ok) {
          setErrorMessage(
            itemRes.data?.error ||
              itemRes.data?.message ||
              "Tạo banner item thất bại"
          );
          setSubmitting(false);
          return;
        }
      }

      setSuccessMessage("Tạo banner thành công");
      setTimeout(() => {
        navigate("/banner/list");
      }, 900);
    } catch (error) {
      setErrorMessage("Có lỗi xảy ra khi tạo banner");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100/80 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-2xl bg-gradient-to-r from-sky-700 via-cyan-700 to-teal-700 p-6 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/90">
            Quản lý banner
          </p>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">Tạo banner mới</h1>
          <p className="mt-2 max-w-3xl text-sm text-cyan-50 sm:text-base">
            Tạo cụm slider và thêm ảnh theo thứ tự hiển thị. Tắt banner thì toàn
            bộ cụm này sẽ không hiển thị ngoài client.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Thông tin banner</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Thiết lập trạng thái banner và quản lý danh sách ảnh hiển thị.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2">
                  <input
                    type="checkbox"
                    name="status"
                    checked={bannerForm.status}
                    onChange={handleBannerChange}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">Bật banner</span>
                </label>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Danh sách ảnh banner</h3>
                <p className="mt-1 text-xs text-slate-500">Mỗi item tương ứng một ảnh trong slider</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <p className="text-sm font-bold text-slate-800">Item #{index + 1}</p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={addItem}
                        className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-700"
                      >
                        + Thêm ảnh
                      </button>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">Ảnh banner</label>
                      <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
                        <div className="bg-slate-100">
                          {item.preview ? (
                            <img
                              src={item.preview}
                              alt={`Preview ${index + 1}`}
                              className="h-44 w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-44 items-center justify-center text-xs font-medium text-slate-400">
                              Chưa chọn ảnh
                            </div>
                          )}
                        </div>
                        <div className="border-t border-slate-200 p-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleItemChange(index, e)}
                            className="block w-full text-sm text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-cyan-700"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                            URL
                          </label>
                          <input
                            type="text"
                            name="url"
                            value={item.url}
                            onChange={(e) => handleItemChange(index, e)}
                            placeholder="Ví dụ: /tuyen-dung"
                            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                            Thứ tự
                          </label>
                          <input
                            type="number"
                            min="0"
                            name="sort_order"
                            value={item.sort_order}
                            onChange={(e) => handleItemChange(index, e)}
                            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                          />
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            name="status"
                            checked={item.status}
                            onChange={(e) => handleItemChange(index, e)}
                            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                          />
                          <span className="text-sm font-semibold text-slate-700">Hiển thị item này</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/banner/list")}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Quay lại
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Đang tạo..." : "Tạo banner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}