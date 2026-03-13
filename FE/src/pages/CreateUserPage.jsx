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
    <div className="rounded-2xl bg-white p-6 shadow max-w-2xl">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Create User
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tạo tài khoản mới cho nhân viên
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Username */}

        <div>
          <label className="block text-sm font-medium mb-1">
            Username
          </label>

          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Nhập username"
            required
          />
        </div>

        {/* Email */}

        <div>
          <label className="block text-sm font-medium mb-1">
            Email
          </label>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="example@gmail.com"
            required
          />
        </div>

        {/* Password */}

        <div>
          <label className="block text-sm font-medium mb-1">
            Password
          </label>

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ít nhất 8 ký tự"
            required
          />
        </div>

        {/* Role */}

        <div>
          <label className="block text-sm font-medium mb-1">
            Role
          </label>

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Active */}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
          <label className="text-sm">
            Active account
          </label>
        </div>

        {/* Error */}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Buttons */}

        <div className="flex gap-3">

          <button
            type="button"
            onClick={() => navigate("/user/list")}
            className="px-4 py-2 border rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {loading ? "Creating..." : "Create User"}
          </button>

        </div>

      </form>

    </div>
  );
}