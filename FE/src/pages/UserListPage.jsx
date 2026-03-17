import { useEffect, useMemo, useState } from "react";
import { getUsersApi, updateUserApi } from "../api/userApi";
import { useNavigate } from "react-router-dom";

export default function UserListPage() {

  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingIds, setUpdatingIds] = useState([]);

  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setMessage("");

    const result = await getUsersApi();

    if (result.ok) {
      setUsers(result.data.users || []);
    } else {
      setMessage(result.data?.error || "Không thể tải danh sách người dùng");
    }

    setLoading(false);
  }

  function handleSelectChange(user, value) {
    if (user.is_active === (value === "active")) {
      return;
    }

    setSelectedUser(user);
    setSelectedStatus(value === "active");
    setConfirmModal(true);
  }

  async function handleConfirm() {

    if (!selectedUser) return;

    const userId = selectedUser.id;

    setUpdatingIds((prev) => [...prev, userId]);
    setMessage("");

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, is_active: selectedStatus }
          : u
      )
    );

    setConfirmModal(false);

    const result = await updateUserApi(userId, {
      is_active: selectedStatus
    });

    if (!result.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, is_active: !selectedStatus }
            : u
        )
      );
      setMessage(result.data?.error || "Không thể cập nhật trạng thái");
    }

    setUpdatingIds((prev) => prev.filter((id) => id !== userId));
    setSelectedUser(null);
    setSelectedStatus(null);
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = [
        String(user.id),
        user.username,
        user.email,
      ]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? user.is_active
            : !user.is_active;

      const matchesRole =
        roleFilter === "all" ? true : user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  const totalCount = users.length;
  const activeCount = users.filter((user) => user.is_active).length;
  const inactiveCount = totalCount - activeCount;
  const adminCount = users.filter((user) => user.role === "admin").length;

  return (
    <>
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-900 text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.75)]">
          <div className="flex flex-col gap-6 px-6 py-7 lg:flex-row lg:items-end lg:justify-between lg:px-8">
            <div className="max-w-2xl">
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white lg:text-4xl">
                Quản lý danh sách nhân viên
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Theo dõi tài khoản, lọc theo vai trò hoặc trạng thái và cập nhật active hoặc inactive ngay trên bảng.
              </p>
            </div>

            <button
              onClick={() => navigate("/user/create")}
              className="inline-flex items-center justify-center rounded-2xl bg-rose-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-rose-300"
            >
              + Tạo tài khoản mới
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <p className="text-sm font-semibold text-slate-500">Tổng tài khoản</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{totalCount}</p>
            <p className="mt-2 text-sm text-slate-500">Tất cả user trong hệ thống</p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm shadow-emerald-100/70">
            <p className="text-sm font-semibold text-emerald-700">Đang hoạt động</p>
            <p className="mt-3 text-3xl font-black text-emerald-900">{activeCount}</p>
            <p className="mt-2 text-sm text-emerald-700/80">Có quyền truy cập hệ thống</p>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm shadow-amber-100/70">
            <p className="text-sm font-semibold text-amber-700">Đã vô hiệu hóa</p>
            <p className="mt-3 text-3xl font-black text-amber-900">{inactiveCount}</p>
            <p className="mt-2 text-sm text-amber-700/80">Tạm khóa nhưng vẫn lưu dữ liệu</p>
          </div>

          <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5 shadow-sm shadow-indigo-100/70">
            <p className="text-sm font-semibold text-indigo-700">Tài khoản Admin</p>
            <p className="mt-3 text-3xl font-black text-indigo-900">{adminCount}</p>
            <p className="mt-2 text-sm text-indigo-700/80">Quyền quản trị hệ thống</p>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.55)] lg:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Danh sách user</h2>
              <p className="mt-1 text-sm text-slate-500">
                Quản lý thông tin user và đổi trạng thái ngay trong bảng.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm theo id, username, email"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:bg-white sm:w-72"
              />

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-rose-400"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-rose-400"
              >
                <option value="all">Tất cả trạng thái</option>
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
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                      Người dùng
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                      Email
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                      Vai trò
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                      Trạng thái
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                      Ngày tạo
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                      Hành động
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-14 text-center text-sm font-medium text-slate-500">
                        Đang tải danh sách người dùng...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-14 text-center text-sm font-medium text-slate-500">
                        Không tìm thấy user nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isUpdating = updatingIds.includes(user.id);

                      return (
                        <tr key={user.id} className="transition hover:bg-slate-50/80">
                          <td className="px-5 py-4 align-top">
                            <div className="flex items-start gap-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-sm font-black uppercase text-white shadow-lg shadow-indigo-500/20">
                                {user.username?.slice(0, 1) || "U"}
                              </div>

                              <div>
                                <p className="text-base font-bold text-slate-900">
                                  {user.username}
                                </p>
                                {/* <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                                  ID: {user.id}
                                </p> */}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <p className="max-w-[280px] truncate text-sm text-slate-600" title={user.email}>
                              {user.email}
                            </p>
                          </td>

                          <td className="px-5 py-4 align-top">
                            {user.role === "admin" ? (
                              <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                Staff
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 align-top">
                            <select
                              value={user.is_active ? "active" : "inactive"}
                              onChange={(event) =>
                                handleSelectChange(user, event.target.value)
                              }
                              disabled={isUpdating}
                              className={`w-full min-w-36 rounded-2xl border px-4 py-2.5 text-sm font-semibold outline-none transition ${
                                user.is_active
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                              } ${isUpdating ? "cursor-not-allowed opacity-70" : "focus:border-rose-400"}`}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </td>

                          <td className="px-5 py-4 align-top text-sm text-slate-500">
                            {new Date(user.created_at).toLocaleDateString("vi-VN")}
                          </td>

                          <td className="px-5 py-4 align-top text-right">
                            <button
                              onClick={() => navigate(`/user/edit/${user.id}`)}
                              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                            >
                              Chỉnh sửa
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Đang hiển thị {filteredUsers.length} / {totalCount} user
            </p>
          </div>
        </div>
      </section>

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">
              Xác nhận thay đổi trạng thái
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Bạn có chắc muốn chuyển tài khoản{" "}
              <span className="font-bold text-slate-900">
                {selectedUser?.username}
              </span>{" "}
              sang trạng thái{" "}
              <span
                className={`font-bold ${
                  selectedStatus ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {selectedStatus ? "Active" : "Inactive"}
              </span>{" "}
              không?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-400"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}