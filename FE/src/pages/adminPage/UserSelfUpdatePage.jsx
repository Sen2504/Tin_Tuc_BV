import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { meApi } from "@/api/authApi";
import { updateMyProfileApi } from "@/api/userApi";
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

export default function UserSelfUpdatePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [roleLabel, setRoleLabel] = useState("staff");

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

    async function loadMe() {
      setLoading(true);

      const result = await meApi();

      if (!mounted) return;

      if (!result.ok) {
        showPopup("error", getBackendMessage(result.data, "Không thể tải thông tin tài khoản"));
        setLoading(false);
        return;
      }

      const me = result.data?.user || result.data || {};

      setForm({
        username: me.username || "",
        email: me.email || "",
        password: "",
      });
      setRoleLabel(String(me.role || "staff"));
      setLoading(false);
    }

    loadMe();

    return () => {
      mounted = false;
    };
  }, [showPopup]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setSubmitting(true);

    const payload = {
      username: form.username,
      email: form.email,
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    const result = await updateMyProfileApi(payload);

    if (!result.ok) {
      showPopup("error", getBackendMessage(result.data, "Cập nhật tài khoản thất bại"));
      setSubmitting(false);
      return;
    }

    showPopup("success", getBackendMessage(result.data, "Cập nhật tài khoản thành công"));
    setSubmitting(false);
    setForm((prev) => ({ ...prev, password: "" }));

    setTimeout(() => {
      navigate("/dashboard");
    }, 1400);
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
      <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-cyan-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-56 w-56 rounded-full bg-amber-100 blur-3xl" />

      <div className="relative mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-700">
            Account Settings
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            Cập nhật tài khoản của tôi
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Trang này chỉ chỉnh sửa thông tin của chính tài khoản đang đăng nhập.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Vai trò hiện tại</p>
          <p className="mt-2 text-sm font-bold text-slate-700">{roleLabel}</p>
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
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
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
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
              Password mới (không bắt buộc)
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Để trống nếu không muốn đổi mật khẩu"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Về dashboard
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
          >
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>

      <ToastStack toasts={toasts} removeToast={removeToast} />
    </section>
  );
}
