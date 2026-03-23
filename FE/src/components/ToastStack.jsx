import { useEffect } from "react";

function ToastItem({ toast, onClose }) {
  const {
    id,
    type = "success",
    message = "",
    duration = 5000,
  } = toast;

  const isSuccess = type === "success";

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-start gap-3 p-4">
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-black ${
            isSuccess
              ? "bg-emerald-100 text-emerald-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {isSuccess ? "✓" : "!"}
        </div>

        <div className="min-w-0 flex-1">
          <h4
            className={`text-sm font-black ${
              isSuccess ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {isSuccess ? "Thành công" : "Thất bại"}
          </h4>

          <p className="mt-1 break-words text-sm leading-5 text-slate-600">
            {message || "Có thông báo từ hệ thống"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onClose(id)}
          className="shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          ✕
        </button>
      </div>

      <div className="h-1.5 w-full bg-slate-100">
        <div
          className={`h-full origin-left ${
            isSuccess ? "bg-emerald-500" : "bg-red-500"
          }`}
          style={{
            animation: `toastCountdown ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

export default function ToastStack({ toasts = [], removeToast }) {
  if (!toasts.length) return null;

  return (
    <>
      <style>
        {`
          @keyframes toastCountdown {
            from {
              transform: scaleX(1);
            }
            to {
              transform: scaleX(0);
            }
          }
        `}
      </style>

      <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={removeToast}
          />
        ))}
      </div>
    </>
  );
}