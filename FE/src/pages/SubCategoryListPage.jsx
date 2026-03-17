import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getSubCategoriesApi, updateSubCategoryApi } from "../api/subcategoryApi";

export default function SubCategoryListPage() {
  const navigate = useNavigate();

  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [parentFilter, setParentFilter] = useState("all");
  const [updatingIds, setUpdatingIds] = useState([]);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedNextStatus, setSelectedNextStatus] = useState(null);

  useEffect(() => {
    loadSubCategories();
  }, []);

  async function loadSubCategories() {
    setLoading(true);
    setMessage("");

    const result = await getSubCategoriesApi();

    if (!result.ok) {
      setMessage("Cannot load subcategories");
      setLoading(false);
      return;
    }

    setSubcategories(result.data.subcategories || []);
    setLoading(false);
  }

  function handleOpenConfirm(subcategory, nextValue) {
    const nextStatus = nextValue === "active";

    if (!subcategory || subcategory.status === nextStatus) {
      return;
    }

    setSelectedSubcategory(subcategory);
    setSelectedNextStatus(nextStatus);
    setConfirmModalOpen(true);
  }

  function handleCloseConfirm() {
    setConfirmModalOpen(false);
    setSelectedSubcategory(null);
    setSelectedNextStatus(null);
  }

  async function handleConfirmStatusChange() {
    if (!selectedSubcategory || selectedNextStatus === null) return;

    const subcategoryId = selectedSubcategory.id;
    const oldStatus = selectedSubcategory.status;
    const nextStatus = selectedNextStatus;

    setUpdatingIds((prev) => [...prev, subcategoryId]);
    setMessage("");

    handleCloseConfirm();

    setSubcategories((prev) =>
      prev.map((sub) =>
        sub.id === subcategoryId
          ? { ...sub, status: nextStatus }
          : sub
      )
    );

    const result = await updateSubCategoryApi(subcategoryId, { status: nextStatus });

    if (!result.ok) {
      setSubcategories((prev) =>
        prev.map((sub) =>
          sub.id === subcategoryId
            ? { ...sub, status: oldStatus }
            : sub
        )
      );
      setMessage(result.data?.error || "Không thể cập nhật trạng thái danh mục con");
      setUpdatingIds((prev) => prev.filter((id) => id !== subcategoryId));
      return;
    }

    const updatedSubcategory = result.data?.subcategory;

    if (updatedSubcategory) {
      setSubcategories((prev) =>
        prev.map((sub) =>
          sub.id === subcategoryId
            ? { ...sub, ...updatedSubcategory }
            : sub
        )
      );
    }

    setUpdatingIds((prev) => prev.filter((id) => id !== subcategoryId));
  }

  const parentCategoryOptions = useMemo(() => {
    return Array.from(
      new Set(
        subcategories
          .map((sub) => sub.category_name)
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "vi"));
  }, [subcategories]);

  const filteredSubcategories = useMemo(() => {
    return subcategories.filter((sub) => {
      const matchesSearch = [String(sub.id), sub.name, sub.category_name]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? sub.status
            : !sub.status;

      const matchesParent =
        parentFilter === "all"
          ? true
          : (sub.category_name || "") === parentFilter;

      return matchesSearch && matchesStatus && matchesParent;
    });
  }, [subcategories, searchTerm, statusFilter, parentFilter]);

  const totalCount = subcategories.length;
  const activeCount = subcategories.filter((sub) => sub.status).length;
  const hiddenCount = totalCount - activeCount;

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[28px] bg-gradient-to-r from-zinc-950 via-rose-950 to-orange-900 text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.75)]">
        <div className="flex flex-col gap-6 px-6 py-7 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white lg:text-4xl">
              Quản lý danh sách danh mục con
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-orange-100/85">
              Theo dõi danh mục con theo từng danh mục cha, lọc nhanh trạng thái hiển thị và truy cập chỉnh sửa chỉ với một thao tác.
            </p>
          </div>

          <button
            onClick={() => navigate("/subcategory/create")}
            className="inline-flex items-center justify-center rounded-2xl bg-orange-300 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-orange-200"
          >
            + Tạo danh mục con mới
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70">
          <p className="text-sm font-semibold text-zinc-500">Tổng danh mục con</p>
          <p className="mt-3 text-3xl font-black text-zinc-900">{totalCount}</p>
          <p className="mt-2 text-sm text-zinc-500">Toàn bộ mục con đang quản lý</p>
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
          <div>
            <h2 className="text-xl font-black text-zinc-900">Danh sách danh mục con</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Giao diện này dùng màu nhận diện riêng để tránh nhầm với danh mục cha.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm theo id, tên, category"
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 outline-none transition focus:border-orange-400"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Active</option>
              <option value="inactive">Hidden</option>
            </select>
          </div>
        </div>

        {message && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {message}
          </div>
        )}

        <div className="overflow-hidden rounded-[24px] border border-zinc-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                    Danh mục con
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                    <div className="flex min-w-[140px] flex-col gap-2">
                      <span>Danh mục cha</span>
                      <select
                        value={parentFilter}
                        onChange={(event) => setParentFilter(event.target.value)}
                        className="w-auto self-start rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[11px] font-semibold normal-case tracking-normal text-zinc-700 outline-none transition focus:border-orange-400"
                      >
                        <option value="all">Tất cả danh mục cha</option>
                        {parentCategoryOptions.map((categoryName) => (
                          <option key={categoryName} value={categoryName}>
                            {categoryName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                    Trạng thái
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                    Hành động
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-14 text-center text-sm font-medium text-zinc-500">
                      Đang tải danh sách danh mục con...
                    </td>
                  </tr>
                ) : filteredSubcategories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-14 text-center text-sm font-medium text-zinc-500">
                      Không có danh mục con phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredSubcategories.map((sub) => (
                    (() => {
                      const isUpdating = updatingIds.includes(sub.id);

                      return (
                    <tr key={sub.id} className="transition hover:bg-orange-50/40">
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-sm font-black uppercase text-white shadow-lg shadow-orange-500/20">
                            {sub.name?.slice(0, 1) || "S"}
                          </div>

                          <div>
                            <p className="text-base font-bold text-zinc-900">{sub.name}</p>
                            {/* <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                              ID: {sub.id}
                            </p> */}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="text-sm font-medium text-zinc-700">{sub.category_name || "N/A"}</p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <select
                          value={sub.status ? "active" : "inactive"}
                          onChange={(event) =>
                            handleOpenConfirm(sub, event.target.value)
                          }
                          disabled={isUpdating}
                          className={`w-full min-w-36 rounded-2xl border px-4 py-2.5 text-sm font-semibold outline-none transition ${
                            sub.status
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                          } ${isUpdating ? "cursor-not-allowed opacity-70" : "focus:border-orange-400"}`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>

                      <td className="px-5 py-4 align-top text-right">
                        <button
                          onClick={() => navigate(`/subcategory/update/${sub.id}`)}
                          className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100"
                        >
                          Chỉnh sửa
                        </button>
                      </td>
                    </tr>
                      );
                    })()
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Đang hiển thị {filteredSubcategories.length} / {totalCount} sub category
          </p>
        </div>
      </div>

      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-zinc-900">
              Xác nhận thay đổi trạng thái
            </h3>

            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Bạn có chắc muốn chuyển danh mục con{" "}
              <span className="font-bold text-zinc-900">
                {selectedSubcategory?.name}
              </span>{" "}
              sang trạng thái{" "}
              <span
                className={`font-bold ${
                  selectedNextStatus ? "text-emerald-600" : "text-rose-600"
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
                className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className="rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}