import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserApi } from "../api/userApi";

export default function CreateUserPage() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "staff",
    is_active: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const result = await createUserApi(form);

    if (!result.ok) {

      if (result.data.errors) {
        setError(Object.values(result.data.errors).join(", "));
      } else {
        setError(result.data.error || "Create user failed");
      }

      setLoading(false);
      return;
    }

    navigate("/user/list");
  }

  return (

    <div className="flex justify-center">

      <div className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow">

        {/* HEADER */}

        <div className="flex items-center justify-between mb-8">

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Create User
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Tạo tài khoản mới cho nhân viên
            </p>
          </div>

        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* GRID INPUT */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* USERNAME */}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username
              </label>

              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Nhập username"
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* EMAIL */}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@gmail.com"
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* PASSWORD */}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Ít nhất 8 ký tự"
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ROLE */}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Role
              </label>

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

          </div>

          {/* ACTIVE SWITCH */}

          <div className="flex items-center justify-between border rounded-xl px-4 py-3 bg-slate-50">

            <div>
              <p className="text-sm font-medium text-slate-700">
                Active Account
              </p>

              <p className="text-xs text-slate-500">
                Cho phép người dùng đăng nhập hệ thống
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">

              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="sr-only peer"
              />

              <div
                className="w-11 h-6 bg-gray-300 rounded-full peer
                peer-checked:bg-blue-600
                after:content-['']
                after:absolute after:top-[2px] after:left-[2px]
                after:bg-white after:border after:rounded-full
                after:h-5 after:w-5 after:transition-all
                peer-checked:after:translate-x-full"
              ></div>

            </label>

          </div>

          {/* ERROR */}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* BUTTON */}

          <div className="flex justify-end gap-3 pt-2">

            <button
              type="button"
              onClick={() => navigate("/user/list")}
              className="rounded-xl border border-slate-300 px-5 py-2 text-sm hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {loading ? "Creating..." : "Create User"}
            </button>

          </div>

        </form>

      </div>

    </div>

  );
}