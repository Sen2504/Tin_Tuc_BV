import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteInfoApi, getInfosApi, updateInfoApi } from "@/api/infoApi";
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

export default function InfoListPage() {
  const navigate = useNavigate();
  const ITEMS_PER_PAGE = 5;

  const [infos, setInfos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingIds, setUpdatingIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [selectedNextStatus, setSelectedNextStatus] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingInfo, setDeletingInfo] = useState(null);

  const [toasts, setToasts] = useState([]);

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
    loadInfos();
  }, []);

  async function loadInfos() {
    setLoading(true);

    const result = await getInfosApi();

    if (!result.ok) {
      showPopup("error", getBackendMessage(result.data, "Không thể tải danh sách info"));
      setLoading(false);
      return;
    }

    setInfos(result.data.infos || []);
    setLoading(false);
  }

  function handleClearFilters() {
    setStatusFilter("all");
    setSearchTerm("");
    setCurrentPage(1);
  }

  function handleOpenConfirm(info, nextValue) {
    const nextStatus = nextValue === "active";

    if (!info || info.status === nextStatus) {
      return;
    }

    setSelectedInfo(info);
    setSelectedNextStatus(nextStatus);
    setConfirmModalOpen(true);
  }

  function handleCloseConfirm() {
    setConfirmModalOpen(false);
    setSelectedInfo(null);
    setSelectedNextStatus(null);
  }

  function handleOpenDeleteModal(info) {
    setDeletingInfo(info);
    setDeleteModalOpen(true);
  }

  function handleCloseDeleteModal() {
    setDeletingInfo(null);
    setDeleteModalOpen(false);
  }

  async function handleConfirmStatusChange() {
    if (!selectedInfo || selectedNextStatus === null) return;

    const infoId = selectedInfo.id;
    const oldStatus = selectedInfo.status;
    const nextStatus = selectedNextStatus;

    setUpdatingIds((prev) => [...prev, infoId]);

    handleCloseConfirm();

    setInfos((prev) =>
      prev.map((item) => (item.id === infoId ? { ...item, status: nextStatus } : item))
    );

    const result = await updateInfoApi(infoId, { status: nextStatus });

    if (!result.ok) {
      setInfos((prev) =>
        prev.map((item) => (item.id === infoId ? { ...item, status: oldStatus } : item))
      );
      showPopup("error", getBackendMessage(result.data, "Không thể cập nhật trạng thái info"));
      setUpdatingIds((prev) => prev.filter((id) => id !== infoId));
      return;
    }

    const updatedInfo = result.data?.info;

    if (updatedInfo) {
      setInfos((prev) =>
        prev.map((item) => (item.id === infoId ? { ...item, ...updatedInfo } : item))
      );
    }

    showPopup("success", getBackendMessage(result.data, "Cập nhật trạng thái info thành công"));
    setUpdatingIds((prev) => prev.filter((id) => id !== infoId));
  }

  async function handleConfirmDeleteInfo() {
    if (!deletingInfo) return;

    const infoId = deletingInfo.id;

    setDeletingIds((prev) => [...prev, infoId]);
    handleCloseDeleteModal();

    const result = await deleteInfoApi(infoId);

    if (!result.ok) {
      showPopup("error", getBackendMessage(result.data, "Xóa info thất bại"));
      setDeletingIds((prev) => prev.filter((id) => id !== infoId));
      return;
    }

    setInfos((prev) => prev.filter((item) => item.id !== infoId));
    showPopup("success", getBackendMessage(result.data, "Xóa info thành công"));
    setDeletingIds((prev) => prev.filter((id) => id !== infoId));
  }

  const filteredInfos = useMemo(() => {
    return infos.filter((item) => {
      const matchesSearch = [String(item.id), item.title]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? item.status
            : !item.status;

      return matchesSearch && matchesStatus;
    });
  }, [infos, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInfos.length / ITEMS_PER_PAGE));

  const paginatedInfos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredInfos.slice(startIndex, endIndex);
  }, [filteredInfos, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totalCount = infos.length;
  const activeCount = infos.filter((item) => item.status).length;
  const hiddenCount = totalCount - activeCount;

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[28px] bg-gradient-to-r from-zinc-950 via-rose-950 to-orange-900 text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.75)]">
        <div className="flex flex-col gap-6 px-6 py-7 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white lg:text-4xl">
              Quản lý thông tin trang chủ
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-orange-100/85">
              Theo dõi thông tin, lọc nhanh trạng thái hiển thị và cập nhật trực tiếp ngay trên giao diện danh sách.
            </p>
          </div>

          <button
            onClick={() => navigate("/info/create")}
            className="inline-flex items-center justify-center rounded-2xl bg-orange-300 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-orange-200"
          >
            + Tạo info mới
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70">
          <p className="text-sm font-semibold text-zinc-500">Tổng info</p>
          <p className="mt-3 text-3xl font-black text-zinc-900">{totalCount}</p>
          <p className="mt-2 text-sm text-zinc-500">Toàn bộ thông tin đang quản lý</p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm shadow-emerald-100/70">
          <p className="text-sm font-semibold text-emerald-700">Đang hiển thị</p>
          <p className="mt-3 text-3xl font-black text-emerald-900">{activeCount}</p>
          <p className="mt-2 text-sm text-emerald-700/80">Hiển thị ở giao diện người dùng</p>
        </div>

        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5 shadow-sm shadow-rose-100/70 sm:col-span-2 xl:col-span-1">
          <p className="text-sm font-semibold text-rose-700">Đang ẩn</p>
          <p className="mt-3 text-3xl font-black text-rose-900">{hiddenCount}</p>
          <p className="mt-2 text-sm text-rose-700/80">Ẩn khỏi giao diện người dùng</p>
        </div>
      </div>

      <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.55)] lg:p-6">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <h2 className="text-xl font-black text-zinc-900">Danh sách info</h2>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 outline-none transition focus:border-orange-400"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Active</option>
              <option value="inactive">Hidden</option>
            </select>

            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm theo id, title"
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white sm:w-64 xl:w-72"
            />

            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-zinc-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase text-zinc-500">
                    Tiêu đề info
                  </th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase text-zinc-500">
                    Trạng thái
                  </th>
                  <th className="w-[220px] px-5 py-4 text-left text-[11px] font-bold uppercase text-zinc-500">
                    Hành động
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-14 text-center text-sm font-medium text-zinc-500">
                      Đang tải danh sách info...
                    </td>
                  </tr>
                ) : filteredInfos.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-14 text-center text-sm font-medium text-zinc-500">
                      Không có info phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  paginatedInfos.map((item) => {
                    const isUpdating = updatingIds.includes(item.id);
                    const isDeleting = deletingIds.includes(item.id);

                    return (
                      <tr key={item.id} className="transition hover:bg-orange-50/40">
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-sm font-black uppercase text-white shadow-lg shadow-orange-500/20">
                              {item.title?.slice(0, 1) || "I"}
                            </div>

                            <div>
                              <p className="text-sm font-bold text-zinc-900">{item.title}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <select
                            value={item.status ? "active" : "inactive"}
                            onChange={(event) => handleOpenConfirm(item, event.target.value)}
                            disabled={isUpdating || isDeleting}
                            className={`w-[122px] rounded-xl border px-3 py-2 text-[12px] font-semibold outline-none transition ${
                              item.status
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            } ${
                              isUpdating || isDeleting
                                ? "cursor-not-allowed opacity-70"
                                : "focus:border-cyan-400"
                            }`}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>

                        <td className="px-5 py-4 align-top text-left">
                          <div className="flex justify-start gap-2">
                            <button
                              onClick={() => navigate(`/info/update/${item.id}`)}
                              disabled={isDeleting}
                              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(item)}
                              disabled={isDeleting}
                              className="inline-flex items-center justify-center rounded-xl bg-red-500 px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isDeleting ? "Đang xóa..." : "Xóa"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>

            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              const isActive = page === currentPage;

              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-orange-500 text-white"
                      : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-zinc-900">Xác nhận thay đổi trạng thái</h3>

            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Bạn có chắc muốn chuyển info{" "}
              <span className="font-bold text-zinc-900">{selectedInfo?.title}</span>{" "}
              sang trạng thái{" "}
              <span className={`font-bold ${selectedNextStatus ? "text-emerald-600" : "text-rose-600"}`}>
                {selectedNextStatus ? "Active" : "Inactive"}
              </span>{" "}
              không?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseConfirm}
                className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={selectedInfo && updatingIds.includes(selectedInfo.id)}
                className="rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {selectedInfo && updatingIds.includes(selectedInfo.id) ? "Đang cập nhật..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-zinc-900">Xác nhận xóa info</h3>

            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Bạn có chắc muốn xóa info{" "}
              <span className="font-bold text-zinc-900">{deletingInfo?.title}</span> không?
            </p>

            <p className="mt-2 text-sm leading-6 text-rose-600">
              Thao tác này có thể ảnh hưởng dữ liệu liên quan.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteInfo}
                disabled={deletingInfo && deletingIds.includes(deletingInfo.id)}
                className="rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deletingInfo && deletingIds.includes(deletingInfo.id) ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastStack toasts={toasts} removeToast={removeToast} />
    </section>
  );
}