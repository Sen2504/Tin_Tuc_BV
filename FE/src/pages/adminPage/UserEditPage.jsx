import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUsersApi, updateUserApi } from "@/api/userApi";
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

export default function UserEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "staff",
    is_active: true,
  });

  const [initialUser, setInitialUser] = useState(null);

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

  const removeToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      setLoading(true);

      const result = await getUsersApi();

      if (!mounted) return;

      if (!result.ok) {
        showPopup("error", getBackendMessage(result.data, "Không thể tải dữ liệu user"));
        setLoading(false);
        return;
      }

      const users = result.data?.users || [];
      const targetId = Number(id);
      const user = users.find((u) => Number(u.id) === targetId);

      if (!user) {
        showPopup("error", "Không tìm thấy tài khoản cần chỉnh sửa");
        setLoading(false);
        return;
      }

      setInitialUser(user);
      setForm({
        username: user.username || "",
        email: user.email || "",
        password: "",
        role: user.role || "staff",
        is_active: Boolean(user.is_active),
      });
      setLoading(false);
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, [id, showPopup]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setSubmitting(true);

    const payload = {
      username: form.username,
      email: form.email,
      role: form.role,
      is_active: form.is_active,
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    const result = await updateUserApi(id, payload);

    if (!result.ok) {
      showPopup("error", getBackendMessage(result.data, "Cập nhật tài khoản thất bại"));
      setSubmitting(false);
      return;
    }

    showPopup("success", getBackendMessage(result.data, "Cập nhật tài khoản thành công"));

    setTimeout(() => {
      navigate("/user/list");
    }, 1600);
  }

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
        Đang tải thông tin tài khoản...
      </section>
    );
  }

  return (
    <section className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_-35px_rgba(15,23,42,0.55)] sm:p-8">
      <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-indigo-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-56 w-56 rounded-full bg-amber-100 blur-3xl" />

      <div className="relative mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-700">
            User Management
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            Chỉnh sửa tài khoản
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Bạn đang chỉnh sửa tài khoản: <span className="font-bold text-slate-800">{initialUser?.username}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
              Password mới (không bắt buộc)
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Để trống nếu không đổi mật khẩu"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="role" className="mb-2 block text-sm font-semibold text-slate-700">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Trạng thái tài khoản</p>
            <p className="text-xs text-slate-500">Bật/tắt quyền đăng nhập vào hệ thống</p>
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
              className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-indigo-600
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
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>

      <ToastStack toasts={toasts} removeToast={removeToast} />
    </section>
  );
}
