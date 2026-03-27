import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getInfoByIdApi, updateInfoApi } from "@/api/infoApi";
import {
  createInfoStatApi,
  deleteInfoStatApi,
  getInfoStatsApi,
  updateInfoStatApi,
} from "@/api/info_statApi";
import ToastStack from "@/components/ToastStack";

const API_ORIGIN = "http://localhost:5000";
const initialStatItem = {
  id: null,
  label: "",
  value: "",
  status: true,
};

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

export default function InfoUpdatePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentImage, setCurrentImage] = useState("");
  const [infoStats, setInfoStats] = useState([{ ...initialStatItem }]);
  const [originalStatIds, setOriginalStatIds] = useState([]);

  const [form, setForm] = useState({
    title: "",
    slogan: "",
    description: "",
    status: true,
    image: null,
    remove_image: false,
  });

  const previewUrl = useMemo(() => {
    if (!form.image) return "";
    return URL.createObjectURL(form.image);
  }, [form.image]);

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
    loadInfo();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function loadInfo() {
    try {
      setLoading(true);

      const result = await getInfoByIdApi(id);

      if (!result.ok) {
        showPopup("error", getBackendMessage(result.data, "Không tải được thông tin info"));
        return;
      }

      const info = result.data?.info;

      if (!info) {
        showPopup("error", "Không tìm thấy dữ liệu info");
        return;
      }

      setForm({
        title: info.title || "",
        slogan: info.slogan || "",
        description: info.description || "",
        status: !!info.status,
        image: null,
        remove_image: false,
      });

      setCurrentImage(info.image || "");

      const statResult = await getInfoStatsApi(info.id, true);

      if (!statResult.ok) {
        setInfoStats([{ ...initialStatItem }]);
        setOriginalStatIds([]);
        showPopup("error", getBackendMessage(statResult.data, "Không tải được info stat"));
        return;
      }

      const statItems = (statResult.data?.info_stats || []).map((item) => ({
        id: item.id,
        label: item.label || "",
        value: item.value || "",
        status: !!item.status,
      }));

      setInfoStats(statItems.length > 0 ? statItems : [{ ...initialStatItem }]);
      setOriginalStatIds(statItems.map((item) => item.id));
    } catch {
      showPopup("error", "Không tải được thông tin info");
    } finally {
      setLoading(false);
    }
  }

  function handleAddInfoStat() {
    setInfoStats((prev) => [...prev, { ...initialStatItem }]);
  }

  function handleRemoveInfoStat(index) {
    setInfoStats((prev) => prev.filter((_, i) => i !== index));
  }

  function handleChangeInfoStat(index, field, value) {
    setInfoStats((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          [field]: value,
        };
      })
    );
  }

  function handleChange(e) {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const selectedFile = files && files[0] ? files[0] : null;

      setForm((prev) => ({
        ...prev,
        [name]: selectedFile,
        remove_image: false,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleRemoveSelectedImage() {
    setForm((prev) => ({
      ...prev,
      image: null,
    }));
  }

  function handleRemoveCurrentImage() {
    setCurrentImage("");

    setForm((prev) => ({
      ...prev,
      image: null,
      remove_image: true,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSubmitting(true);

      const result = await updateInfoApi(id, {
        title: form.title.trim(),
        slogan: form.slogan.trim(),
        description: form.description.trim(),
        status: form.status,
        remove_image: form.remove_image,
        image: form.image,
      });

      if (!result.ok) {
        showPopup("error", getBackendMessage(result.data, "Cập nhật info thất bại"));
        return;
      }

      const validStats = infoStats.filter(
        (item) => item.label.trim() !== "" && item.value.trim() !== ""
      );

      const validStatIds = validStats
        .filter((item) => item.id)
        .map((item) => Number(item.id));

      const deleteStatIds = originalStatIds.filter(
        (existingId) => !validStatIds.includes(Number(existingId))
      );

      for (const statId of deleteStatIds) {
        const deleteRes = await deleteInfoStatApi(statId);
        if (!deleteRes.ok) {
          showPopup(
            "error",
            getBackendMessage(deleteRes.data, "Xóa info stat thất bại")
          );
          return;
        }
      }

      for (const stat of validStats) {
        if (stat.id) {
          const updateStatRes = await updateInfoStatApi(stat.id, {
            label: stat.label,
            value: stat.value,
            status: stat.status,
            info_id: Number(id),
          });

          if (!updateStatRes.ok) {
            showPopup(
              "error",
              getBackendMessage(updateStatRes.data, "Cập nhật info stat thất bại")
            );
            return;
          }
        } else {
          const createStatRes = await createInfoStatApi({
            label: stat.label,
            value: stat.value,
            status: stat.status,
            info_id: Number(id),
          });

          if (!createStatRes.ok) {
            showPopup(
              "error",
              getBackendMessage(createStatRes.data, "Tạo info stat thất bại")
            );
            return;
          }
        }
      }

      showPopup("success", getBackendMessage(result.data, "Cập nhật info thành công"));

      setTimeout(() => {
        navigate("/info/list");
      }, 2000);
    } catch {
      showPopup("error", "Có lỗi xảy ra khi cập nhật info");
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
            Cập nhật info trang chủ
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Chỉnh sửa nội dung hiển thị ở phần thông tin trang chủ và cập nhật
            ảnh minh họa nếu cần.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Tiêu đề
              </label>
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Nhập tiêu đề"
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="slogan"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Slogan
              </label>
              <input
                id="slogan"
                name="slogan"
                value={form.slogan}
                onChange={handleChange}
                placeholder="Nhập slogan"
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
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
                rows={8}
                placeholder="Nhập mô tả cho phần info (không bắt buộc)"
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
                <option value="active">Hiển thị</option>
                <option value="inactive">Ẩn</option>
              </select>
            </div>

            <div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Cài đặt hiện tại
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Info sẽ được lưu với trạng thái
                  <span
                    className={`ml-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      form.status
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {form.status ? "Hiển thị" : "Ẩn"}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Info stat</h3>
                  <p className="text-sm text-slate-500">
                    Cập nhật các số liệu hiển thị cùng khối info.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddInfoStat}
                  disabled={loading || submitting}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  + Thêm stat
                </button>
              </div>

              <div className="space-y-3">
                {infoStats.map((item, index) => (
                  <div
                    key={item.id || `new-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-700">
                        Stat #{index + 1}
                      </p>

                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={item.status}
                            onChange={(e) =>
                              handleChangeInfoStat(index, "status", e.target.checked)
                            }
                            disabled={loading || submitting}
                            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                          />
                          Hiển thị
                        </label>

                        {infoStats.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveInfoStat(index)}
                            disabled={loading || submitting}
                            className="rounded-lg border border-rose-300 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Label
                        </label>
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) =>
                            handleChangeInfoStat(index, "label", e.target.value)
                          }
                          disabled={loading || submitting}
                          placeholder="Ví dụ: Bệnh nhân mỗi năm"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Value
                        </label>
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) =>
                            handleChangeInfoStat(index, "value", e.target.value)
                          }
                          disabled={loading || submitting}
                          placeholder="Ví dụ: 2000+"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Ảnh hiện tại
              </p>

              <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {currentImage && !form.remove_image ? (
                  <img
                    src={`${API_ORIGIN}${currentImage}`}
                    alt="Current info image"
                    className="h-full max-h-[320px] w-full object-cover"
                  />
                ) : (
                  <div className="px-6 text-center text-sm text-slate-400">
                    Chưa có ảnh hiện tại
                  </div>
                )}
              </div>

              {currentImage && !form.remove_image && (
                <button
                  type="button"
                  onClick={handleRemoveCurrentImage}
                  className="mt-4 rounded-xl border border-rose-300 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  Xóa ảnh hiện tại
                </button>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <label className="mb-3 block text-sm font-semibold text-slate-700">
                Ảnh mới
              </label>

              <input
                type="file"
                name="image"
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
                Nếu chọn ảnh mới, ảnh này sẽ thay cho ảnh hiện tại.
              </p>

              {form.image && (
                <button
                  type="button"
                  onClick={handleRemoveSelectedImage}
                  className="mt-4 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Xóa ảnh mới đã chọn
                </button>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Xem trước ảnh mới
              </p>

              <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="New info image preview"
                    className="h-full max-h-[320px] w-full object-cover"
                  />
                ) : (
                  <div className="px-6 text-center text-sm text-slate-400">
                    Chưa chọn ảnh mới
                  </div>
                )}
              </div>

              {form.image && (
                <div className="mt-3 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold">Tên file:</span>{" "}
                    {form.image.name}
                  </p>
                  <p>
                    <span className="font-semibold">Dung lượng:</span>{" "}
                    {(form.image.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => navigate("/info/list")}
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
