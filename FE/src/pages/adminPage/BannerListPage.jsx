import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteBannerApi,
  getBannersApi,
  updateBannerApi,
} from "@/api/bannerApi";
import ToastStack from "@/components/ToastStack";

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

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function countActiveItems(items = []) {
  return items.filter((item) => item?.status).length;
}

function buildImageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}

export default function BannerListPage() {
  const navigate = useNavigate();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingIds, setUpdatingIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [statusConfirmModalOpen, setStatusConfirmModalOpen] = useState(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [selectedNextStatus, setSelectedNextStatus] = useState(null);

  const showPopup = useCallback((type, message, duration = 2200) => {
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

  async function loadBanners() {
    setLoading(true);
    setMessage("");

    const result = await getBannersApi();

    if (!result.ok) {
      setMessage(getBackendMessage(result.data, "Không tải được danh sách banner"));
      setLoading(false);
      return;
    }

    setBanners(result.data || []);
    setLoading(false);
  }

  async function handleChangeStatus(bannerId, nextStatus) {

    setUpdatingIds((prev) => [...prev, bannerId]);

    const result = await updateBannerApi(bannerId, { status: nextStatus });

    if (!result.ok) {
      showPopup("error", getBackendMessage(result.data, "Cập nhật trạng thái thất bại"));
      setUpdatingIds((prev) => prev.filter((id) => id !== bannerId));
      return;
    }

    showPopup("success", "Cập nhật trạng thái banner thành công");

    await loadBanners();
    setUpdatingIds((prev) => prev.filter((id) => id !== bannerId));
  }

  async function handleDeleteBanner(banner) {
    setDeletingIds((prev) => [...prev, banner.id]);

    const result = await deleteBannerApi(banner.id);

    if (!result.ok) {
      showPopup("error", getBackendMessage(result.data, "Xóa banner thất bại"));
      setDeletingIds((prev) => prev.filter((id) => id !== banner.id));
      return;
    }

    setBanners((prev) => prev.filter((item) => item.id !== banner.id));
    showPopup("success", "Xóa banner thành công");
    setDeletingIds((prev) => prev.filter((id) => id !== banner.id));
  }

  function openStatusConfirmModal(banner, nextValue) {
    const nextStatus = nextValue === "active";
    if (banner.status === nextStatus) return;

    setSelectedBanner(banner);
    setSelectedNextStatus(nextStatus);
    setStatusConfirmModalOpen(true);
  }

  function closeStatusConfirmModal() {
    setStatusConfirmModalOpen(false);
    setSelectedBanner(null);
    setSelectedNextStatus(null);
  }

  async function handleConfirmStatusChange() {
    if (!selectedBanner || selectedNextStatus === null) return;

    const bannerId = selectedBanner.id;
    const nextStatus = selectedNextStatus;

    closeStatusConfirmModal();
    await handleChangeStatus(bannerId, nextStatus);
  }

  function openDeleteConfirmModal(banner) {
    setSelectedBanner(banner);
    setDeleteConfirmModalOpen(true);
  }

  function closeDeleteConfirmModal() {
    setDeleteConfirmModalOpen(false);
    setSelectedBanner(null);
  }

  async function handleConfirmDeleteBanner() {
    if (!selectedBanner) return;

    const bannerToDelete = selectedBanner;
    closeDeleteConfirmModal();
    await handleDeleteBanner(bannerToDelete);
  }

  useEffect(() => {
    loadBanners();
  }, []);

  const totalCount = banners.length;
  const activeCount = useMemo(
    () => banners.filter((banner) => banner.status).length,
    [banners]
  );
  const inactiveCount = totalCount - activeCount;

  return (
    <>
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.75)]">
          <div className="flex flex-col gap-6 px-6 py-7 lg:flex-row lg:items-end lg:justify-between lg:px-8">
            <div className="max-w-2xl">
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white lg:text-4xl">
                Quản lý banner trang chủ
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Quản lý trạng thái hiển thị banner, chỉnh sửa nhanh và xóa trực tiếp trên danh sách.
              </p>
            </div>

            <button
              onClick={() => navigate("/banner/create")}
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              + Tạo banner mới
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <p className="text-sm font-semibold text-slate-500">Tổng banner</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{totalCount}</p>
            <p className="mt-2 text-sm text-slate-500">Toàn bộ banner trong hệ thống</p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm shadow-emerald-100/70">
            <p className="text-sm font-semibold text-emerald-700">Đang bật</p>
            <p className="mt-3 text-3xl font-black text-emerald-900">{activeCount}</p>
            <p className="mt-2 text-sm text-emerald-700/80">Đang hiển thị ngoài trang chủ</p>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm shadow-amber-100/70">
            <p className="text-sm font-semibold text-amber-700">Đang tắt</p>
            <p className="mt-3 text-3xl font-black text-amber-900">{inactiveCount}</p>
            <p className="mt-2 text-sm text-amber-700/80">Tạm ẩn khỏi giao diện client</p>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.55)] lg:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-black text-slate-900">Danh sách banner</h2>
            <p className="mt-1 text-sm text-slate-500">
              Chọn trạng thái tại dropdown để cập nhật nhanh. Khi bật banner mới, banner cũ đang bật sẽ tự tắt.
            </p>
          </div>

          {message && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {message}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
              Đang tải danh sách banner...
            </div>
          ) : banners.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
              Chưa có banner nào.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Banner</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Ảnh</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Ngày tạo</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Trạng thái</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-600">Hành động</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {banners.map((banner) => {
                    const isUpdating = updatingIds.includes(banner.id);
                    const isDeleting = deletingIds.includes(banner.id);
                    const itemCount = banner.banner_items?.length || 0;
                    const activeItemCount = countActiveItems(banner.banner_items || []);

                    return (
                      <tr key={banner.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-4 align-top">
                          <p className="font-bold text-slate-900">Banner #{banner.id}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Tổng item: {itemCount} | Item bật: {activeItemCount}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-top">
                          {itemCount > 0 ? (
                            <div className="flex -space-x-2">
                              {banner.banner_items.slice(0, 3).map((item) => (
                                <img
                                  key={item.id}
                                  src={buildImageUrl(item.media?.file_path || "")}
                                  alt={`Banner ${banner.id} item ${item.id}`}
                                  className="h-10 w-16 rounded-lg border border-white object-cover shadow"
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Không có ảnh</span>
                          )}
                        </td>

                        <td className="px-4 py-4 align-top text-slate-600">
                          {formatDateTime(banner.create_at)}
                        </td>

                        <td className="px-4 py-4 align-top">
                          <select
                            value={banner.status ? "active" : "inactive"}
                            onChange={(event) => openStatusConfirmModal(banner, event.target.value)}
                            disabled={isUpdating || isDeleting}
                            className={`w-full rounded-xl border px-3 py-2 text-sm font-bold outline-none transition ${
                              banner.status
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 focus:border-emerald-400"
                                : "border-rose-200 bg-rose-50 text-rose-700 focus:border-rose-400"
                            }`}
                          >
                            <option value="active">Activate</option>
                            <option value="inactive">Inactivate</option>
                          </select>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/banner/update/${banner.id}`)}
                              disabled={isDeleting}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteConfirmModal(banner)}
                              disabled={isDeleting || isUpdating}
                              className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                            >
                              {isDeleting ? "Đang xóa..." : "Xóa"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {statusConfirmModalOpen && selectedBanner && selectedNextStatus !== null && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Xác nhận đổi trạng thái</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Bạn có chắc muốn chuyển banner #{selectedBanner.id} sang trạng thái
              {" "}
              <span className="font-bold text-slate-900">
                {selectedNextStatus ? "Activate" : "Inactivate"}
              </span>
              ?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeStatusConfirmModal}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmModalOpen && selectedBanner && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Xác nhận xóa banner</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Bạn có chắc muốn xóa banner #{selectedBanner.id}? Hành động này không thể hoàn tác.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteConfirmModal}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBanner}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastStack toasts={toasts} removeToast={removeToast} />
    </>
  );
}
