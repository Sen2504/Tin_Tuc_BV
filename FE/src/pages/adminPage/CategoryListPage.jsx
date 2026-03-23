import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCategoriesApi,
  updateCategoryApi,
  deleteCategoryApi,
} from "@/api/categoryApi";
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

export default function CategoryListPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingIds, setUpdatingIds] = useState([]);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedNextStatus, setSelectedNextStatus] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deletingIds, setDeletingIds] = useState([]);

  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState("");
  const [selectedDescriptionTitle, setSelectedDescriptionTitle] = useState("");

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

  async function loadCategories() {
    setLoading(true);
    setMessage("");

    const result = await getCategoriesApi({ includeInactive: true });

    if (!result.ok) {
      setMessage(getBackendMessage(result.data, "Cannot load categories"));
      setLoading(false);
      return;
    }

    setCategories(result.data.categories || []);
    setLoading(false);
  }

  function handleOpenConfirm(categoryId, nextValue) {
    const nextStatus = nextValue === "active";
    const currentCategory = categories.find((category) => category.id === categoryId);

    if (!currentCategory || currentCategory.status === nextStatus) {
      return;
    }

    setSelectedCategory(currentCategory);
    setSelectedNextStatus(nextStatus);
    setConfirmModalOpen(true);
  }

  function handleCloseConfirm() {
    setConfirmModalOpen(false);
    setSelectedCategory(null);
    setSelectedNextStatus(null);
  }

  function handleOpenDeleteModal(category) {
    setDeletingCategory(category);
    setDeleteModalOpen(true);
  }

  function handleCloseDeleteModal() {
    setDeleteModalOpen(false);
    setDeletingCategory(null);
  }

  function handleOpenDescription(categoryName, description) {
    setSelectedDescriptionTitle(categoryName || "Danh mục");
    setSelectedDescription(description || "Chưa có mô tả.");
    setDescriptionModalOpen(true);
  }

  function handleCloseDescription() {
    setDescriptionModalOpen(false);
    setSelectedDescription("");
    setSelectedDescriptionTitle("");
  }

  async function handleConfirmStatusChange() {
    if (!selectedCategory || selectedNextStatus === null) return;

    const categoryId = selectedCategory.id;
    const oldStatus = selectedCategory.status;
    const nextStatus = selectedNextStatus;

    setUpdatingIds((prev) => [...prev, categoryId]);
    setMessage("");

    handleCloseConfirm();

    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? { ...category, status: nextStatus }
          : category
      )
    );

    const result = await updateCategoryApi(categoryId, { status: nextStatus });

    if (!result.ok) {
      setCategories((prev) =>
        prev.map((category) =>
          category.id === categoryId
            ? { ...category, status: oldStatus }
            : category
        )
      );

      showPopup(
        "error",
        getBackendMessage(result.data, "Cannot update category status")
      );
      setUpdatingIds((prev) => prev.filter((id) => id !== categoryId));
      return;
    }

    const updatedCategory = result.data?.category;

    if (updatedCategory) {
      setCategories((prev) =>
        prev.map((category) =>
          category.id === categoryId
            ? { ...category, ...updatedCategory }
            : category
        )
      );
    }

    showPopup(
      "success",
      getBackendMessage(result.data, "Cập nhật trạng thái thành công")
    );

    setUpdatingIds((prev) => prev.filter((id) => id !== categoryId));
  }

  async function handleConfirmDeleteCategory() {
    if (!deletingCategory) return;

    const categoryId = deletingCategory.id;

    setDeletingIds((prev) => [...prev, categoryId]);
    setMessage("");

    handleCloseDeleteModal();

    const result = await deleteCategoryApi(categoryId);

    if (!result.ok) {
      showPopup(
        "error",
        getBackendMessage(result.data, "Xóa category thất bại")
      );
      setDeletingIds((prev) => prev.filter((id) => id !== categoryId));
      return;
    }

    setCategories((prev) => prev.filter((category) => category.id !== categoryId));

    showPopup(
      "success",
      getBackendMessage(result.data, "Xóa category thành công")
    );

    setDeletingIds((prev) => prev.filter((id) => id !== categoryId));
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const matchesSearch = [category.name, category.description, String(category.id)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? category.status
            : !category.status;

      return matchesSearch && matchesStatus;
    });
  }, [categories, searchTerm, statusFilter]);

  const totalCount = categories.length;
  const activeCount = categories.filter((category) => category.status).length;
  const inactiveCount = totalCount - activeCount;

  const isConfirming =
    selectedCategory && updatingIds.includes(selectedCategory.id);

  const isDeleting =
    deletingCategory && deletingIds.includes(deletingCategory.id);

  return (
    <>
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.75)]">
          <div className="flex flex-col gap-6 px-6 py-7 lg:flex-row lg:items-end lg:justify-between lg:px-8">
            <div className="max-w-2xl">
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white lg:text-4xl">
                Quản lý danh mục điều hướng
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Theo dõi danh mục, lọc nhanh theo trạng thái và đổi active hoặc inactive trực tiếp ngay trên bảng quản lý.
              </p>
            </div>

            <button
              onClick={() => navigate("/category/create")}
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              + Tạo danh mục mới
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <p className="text-sm font-semibold text-slate-500">Tổng danh mục</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{totalCount}</p>
            <p className="mt-2 text-sm text-slate-500">Toàn bộ dữ liệu đang quản lý</p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm shadow-emerald-100/70">
            <p className="text-sm font-semibold text-emerald-700">Đang hiển thị</p>
            <p className="mt-3 text-3xl font-black text-emerald-900">{activeCount}</p>
            <p className="mt-2 text-sm text-emerald-700/80">Đang hiển thị ngoài giao diện</p>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm shadow-amber-100/70">
            <p className="text-sm font-semibold text-amber-700">Đã ẩn</p>
            <p className="mt-3 text-3xl font-black text-amber-900">{inactiveCount}</p>
            <p className="mt-2 text-sm text-amber-700/80">Đã ẩn nhưng vẫn còn trong CSDL</p>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.55)] lg:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Danh sách danh mục</h2>
              <p className="mt-1 text-sm text-slate-500">
                Dữ liệu được tải trực tiếp từ backend và cập nhật trạng thái theo thời gian thực.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by id, name, description"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white sm:w-72"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {message && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {message}
            </div>
          )}

          <div className="overflow-hidden rounded-[24px] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="w-[22%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Danh mục
                    </th>
                    <th className="w-[18%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Mô tả
                    </th>
                    <th className="w-[12%] px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      <span className="block whitespace-normal leading-4">Số lượng danh mục con</span>
                    </th>
                    <th className="w-[12%] px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      <span className="block whitespace-normal leading-4">Số lượng bài viết</span>
                    </th>
                    <th className="w-[12%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Trạng thái
                    </th>
                    <th className="w-[14%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Hành động
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-14 text-center text-sm font-medium text-slate-500">
                        Đang tải danh mục...
                      </td>
                    </tr>
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-14 text-center text-sm font-medium text-slate-500">
                        Không tìm thấy danh mục nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((category) => {
                      const isUpdating = updatingIds.includes(category.id);
                      const isDeletingRow = deletingIds.includes(category.id);
                      const descriptionText = category.description || "Chưa có mô tả.";
                      const subcategoriesCount = Number.isFinite(category.subcategories_count)
                        ? category.subcategories_count
                        : Array.isArray(category.subcategories)
                          ? category.subcategories.length
                          : 0;
                      const postsCount = Number.isFinite(category.posts_count)
                        ? category.posts_count
                        : 0;

                      return (
                        <tr key={category.id} className="transition hover:bg-slate-50/80">
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-start gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-black uppercase text-white shadow-md shadow-cyan-500/20">
                                {category.name?.slice(0, 1) || "C"}
                              </div>

                              <div className="max-w-[240px]">
                                <p className="mt-0.5 break-words text-[13px] font-semibold leading-5 text-slate-900">
                                  {category.name}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 align-top">
                            <p
                              className="max-w-[340px] truncate text-[12px] leading-5 text-slate-600"
                              title={descriptionText}
                            >
                              {descriptionText}
                            </p>
                          </td>

                          <td className="px-4 py-3 text-center align-top">
                            <p className="text-sm font-bold text-slate-800">{subcategoriesCount}</p>
                          </td>

                          <td className="px-4 py-3 text-center align-top">
                            <p className="text-sm font-bold text-slate-800">{postsCount}</p>
                          </td>

                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-2">
                              <select
                                value={category.status ? "active" : "inactive"}
                                onChange={(event) =>
                                  handleOpenConfirm(category.id, event.target.value)
                                }
                                disabled={isUpdating || isDeletingRow}
                                className={`w-[122px] rounded-xl border px-3 py-2 text-[12px] font-semibold outline-none transition ${
                                  category.status
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700"
                                } ${
                                  isUpdating || isDeletingRow
                                    ? "cursor-not-allowed opacity-70"
                                    : "focus:border-cyan-400"
                                }`}
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </div>
                          </td>

                          <td className="px-4 py-3 align-top text-left">
                            <div className="flex justify-start gap-2">
                              <button
                                onClick={() => navigate(`/category/update/${category.id}`)}
                                disabled={isDeletingRow}
                                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                Sửa
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenDeleteModal(category)}
                                disabled={isDeletingRow}
                                className="inline-flex items-center justify-center rounded-xl bg-red-500 px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                {isDeletingRow ? "Đang xóa..." : "Xóa"}
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

          <div className="mt-4 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Đang hiển thị {filteredCategories.length} / {totalCount} danh mục
            </p>
          </div>
        </div>
      </section>

      {descriptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">{selectedDescriptionTitle}</h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">{selectedDescription}</p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleCloseDescription}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">
              Xác nhận thay đổi trạng thái
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Bạn có chắc muốn chuyển danh mục{" "}
              <span className="font-bold text-slate-900">
                {selectedCategory?.name}
              </span>{" "}
              sang trạng thái{" "}
              <span
                className={`font-bold ${
                  selectedNextStatus ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {selectedNextStatus ? "Active" : "Inactive"}
              </span>{" "}
              không?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseConfirm}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={isConfirming}
                className="rounded-2xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isConfirming ? "Đang cập nhật..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">
              Xác nhận xóa danh mục
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Bạn có chắc muốn xóa danh mục{" "}
              <span className="font-bold text-slate-900">
                {deletingCategory?.name}
              </span>{" "}
              không?
            </p>

            <p className="mt-2 text-sm leading-6 text-red-600">
              Thao tác này có thể làm mất dữ liệu liên quan nếu backend đang xóa cứng.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                disabled={isDeleting}
                className="rounded-2xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastStack toasts={toasts} removeToast={removeToast} />
    </>
  );
}