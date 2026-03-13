import { useState } from "react";
import { forgotPasswordApi } from "../api/authApi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const result = await forgotPasswordApi({ email });

    if (!result.ok) {
      alert(result.data.error || "Có lỗi xảy ra");
      return;
    }

    alert("Email reset password đã được gửi");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-2xl font-bold text-center">
          Quên mật khẩu
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Nhập email của bạn"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-4 py-3"
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700"
          >
            Gửi email reset password
          </button>
        </form>
      </div>
    </div>
  );
}