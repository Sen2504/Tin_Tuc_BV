import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserApi, getUsersApi } from "@/api/userApi";
import ToastStack from "@/components/ToastStack";

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
  const [checkingRule, setCheckingRule] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showPopup = useCallback((type, message, duration = 2400) => {
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

  function getBackendMessage(data, fallback) {
    if (data?.message) return data.message;
    if (data?.error) return data.error;

    if (data?.errors && typeof data.errors === "object") {
      const firstField = Object.keys(data.errors)[0];
      const firstError = firstField ? data.errors[firstField] : null;

      if (Array.isArray(firstError) && firstError.length) {
        return firstError[0];
      }
    }

    return fallback;
  }

  useEffect(() => {
    let mounted = true;

    async function loadRoleRule() {
      setCheckingRule(true);

      const result = await getUsersApi();

      if (!mounted) return;

      if (!result.ok) {
        showPopup("error", getBackendMessage(result.data, "Không thể kiểm tra quy tắc role"));
        setCheckingRule(false);
        return;
      }

      const users = result.data?.users || [];
      const hasAdmin = users.some((user) => String(user.role || "").toLowerCase() === "admin");

      setAdminExists(hasAdmin);
      if (hasAdmin) {
        setForm((prev) => ({ ...prev, role: "staff" }));
      }

      setCheckingRule(false);
    }

    loadRoleRule();

    return () => {
      mounted = false;
    };
  }, [showPopup]);

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

    const payload = {
      ...form,
      role: adminExists ? "staff" : form.role,
    };

    const result = await createUserApi(payload);

    if (!result.ok) {
      showPopup("error", getBackendMessage(result.data, "Tạo tài khoản thất bại"));
      setLoading(false);
      return;
    }

    showPopup("success", getBackendMessage(result.data, "Tạo tài khoản thành công"));

    setTimeout(() => {
      navigate("/user/list");
    }, 1800);
  }

  return (
    <section className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_-35px_rgba(15,23,42,0.55)] sm:p-8">
      <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-amber-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-56 w-56 rounded-full bg-cyan-100 blur-3xl" />

      <div className="relative mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-700">
            Account Provisioning
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            Tạo tài khoản nhân sự mới
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Cấp tài khoản đăng nhập cho nhân viên và thiết lập quyền truy cập ngay từ bước khởi tạo.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Quy tắc vai trò
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            {checkingRule
              ? "Đang kiểm tra dữ liệu admin..."
              : adminExists
                ? "Hệ thống đã có admin, tài khoản mới sẽ là staff"
                : "Chưa có admin, có thể tạo tài khoản admin"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Nhập username"
              required
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@gmail.com"
              required
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Ít nhất 8 ký tự, gồm chữ và số"
              required
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              value={adminExists ? "staff" : form.role}
              onChange={handleChange}
              disabled={checkingRule || adminExists}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="staff">Staff</option>
              {!adminExists && <option value="admin">Admin</option>}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              {adminExists
                ? "Role admin đã bị khóa vì hệ thống đã tồn tại tài khoản admin."
                : "Khi hệ thống có admin đầu tiên, các tài khoản tạo sau sẽ mặc định là staff."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Kích hoạt tài khoản</p>
            <p className="text-xs text-slate-500">Cho phép người dùng đăng nhập ngay sau khi xác nhận email</p>
          </div>

          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="peer sr-only"
            />

            <span
              className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-cyan-600
              after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5
              after:rounded-full after:border after:bg-white after:transition-all
              peer-checked:after:translate-x-full"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => navigate("/user/list")}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Trở về danh sách
          </button>

          <button
            type="submit"
            disabled={loading || checkingRule}
            className="rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
          >
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>
        </div>
      </form>

      <ToastStack toasts={toasts} removeToast={removeToast} />
    </section>
  );
}