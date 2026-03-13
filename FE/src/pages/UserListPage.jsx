import { useEffect, useState } from "react";
import { getUsersApi, updateUserApi } from "../api/userApi";
import { useNavigate } from "react-router-dom";

export default function UserListPage() {

  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const result = await getUsersApi();

    if (result.ok) {
      setUsers(result.data.users);
    }

    setLoading(false);
  }

  function handleSelectChange(user, value) {
    setSelectedUser(user);
    setSelectedStatus(value === "active");
    setConfirmModal(true);
  }

  async function handleConfirm() {

    if (!selectedUser) return;

    const result = await updateUserApi(selectedUser.id, {
      is_active: selectedStatus
    });

    if (result.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? { ...u, is_active: selectedStatus }
            : u
        )
      );
    }

    setConfirmModal(false);
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow">

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Danh sách nhân viên
        </h1>

        <button
            onClick={() => navigate("/user/create")}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
            + Create User
        </button>
      </div>

      <table className="min-w-full">

        <thead className="bg-slate-100 text-slate-600 text-sm">
          <tr>
            <th className="px-4 py-3 text-left">ID</th>
            <th className="px-4 py-3 text-left">Username</th>
            <th className="px-4 py-3 text-left w-[220px]">Email</th>
            <th className="px-4 py-3 text-left">Role</th>
            <th className="px-4 py-3 text-left">Active</th>
            <th className="px-4 py-3 text-left">Created</th>
            <th className="px-4 py-3 text-left">Action</th>
          </tr>
        </thead>

        <tbody>

          {users.map((user) => (

            <tr key={user.id} className="border-t hover:bg-slate-50">

              <td className="px-4 py-3">{user.id}</td>

              <td className="px-4 py-3 font-semibold">
                {user.username}
              </td>

              {/* EMAIL thu gọn */}
              <td className="px-4 py-3 text-sm text-slate-600 truncate max-w-[220px]">
                {user.email}
              </td>

              {/* ROLE */}
              <td className="px-4 py-3">

                {user.role === "admin" ? (
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs font-semibold">
                    Admin
                  </span>
                ) : (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-semibold">
                    Staff
                  </span>
                )}

              </td>

              {/* ACTIVE SELECT */}
              <td className="px-4 py-3">

                <select
                  value={user.is_active ? "active" : "inactive"}
                  onChange={(e) =>
                    handleSelectChange(user, e.target.value)
                  }
                  className="border rounded-lg px-2 py-1 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

              </td>

              {/* CREATED */}
              <td className="px-4 py-3 text-sm text-gray-500">
                {new Date(user.created_at).toLocaleDateString()}
              </td>

              {/* ACTION */}
              <td className="px-4 py-3">

                <button
                  onClick={() => navigate(`/user/edit/${user.id}`)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ✏
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

      {/* MODAL CONFIRM */}

      {confirmModal && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white p-6 rounded-xl shadow-xl w-[360px]">

            <h2 className="text-lg font-semibold mb-4">
              Xác nhận thay đổi
            </h2>

            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn thay đổi trạng thái tài khoản này không?
            </p>

            <div className="flex justify-end gap-3">

              <button
                onClick={() => setConfirmModal(false)}
                className="px-4 py-2 rounded-lg border"
              >
                No
              </button>

              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white"
              >
                Yes
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}