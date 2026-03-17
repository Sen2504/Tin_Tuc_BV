import { useEffect, useRef, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { logoutApi } from "../api/authApi";

export default function AdminLayout({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);

  const [logoutMessage, setLogoutMessage] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 200);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleLogout() {
    setLogoutMessage("Đang logout...");

    try {
      const result = await logoutApi();

      if (!result.ok) {
        setLogoutMessage(result.data?.error || result.data?.message || "Logout thất bại");
        return;
      }

      if (setIsAuthenticated) {
        setIsAuthenticated(false);
      }

      navigate("/login");
    } catch (error) {
      setLogoutMessage("Lỗi kết nối server");
      console.error(error);
    }
  }

  function handleScrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="w-full max-w-[280px] bg-slate-900 p-5 text-slate-100 shadow-2xl">

          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Admin
              </p>
              <h2 className="mt-1 text-xl font-bold">Dashboard</h2>
            </div>

            {/* PROFILE MENU */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 p-[2px] transition hover:scale-105"
              >
                <span className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  AD
                </span>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-3 w-48 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-xl">

                  <button
                    type="button"
                    className="block w-full px-4 py-3 text-left text-sm text-slate-100 hover:bg-slate-700"
                  >
                    Profile
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full px-4 py-3 text-left text-sm font-semibold text-red-300 hover:bg-red-500/20"
                  >
                    Logout
                  </button>

                </div>
              )}
            </div>
          </div>

          {/* MENU */}
          <nav className="space-y-3">

            <button
              onClick={() => navigate("/user/list")}
              className="flex w-full items-center gap-3 rounded-xl bg-blue-500/20 px-4 py-3 text-left text-sm font-semibold text-blue-200 hover:bg-blue-500/30"
            >
              Quản lý nhân viên
            </button>

            <button
              onClick={() => navigate("/category/list")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              Quản lý danh mục
            </button>

            <button
              onClick={() => navigate("/subcategory/list")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              Quản lý danh mục con
            </button>

            {logoutMessage && (
              <p className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300">
                {logoutMessage}
              </p>
            )}

          </nav>
        </aside>

        {/* CONTENT */}
        <main className="flex-1 p-6 lg:p-10">
          <Outlet />
        </main>

      </div>

      {/* BUTTON SCROLL TO TOP */}
      {showScrollTop && (
        <button
          type="button"
          onClick={handleScrollToTop}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-xl font-bold text-white shadow-lg transition hover:scale-105 hover:bg-sky-700"
          aria-label="Quay về đầu trang"
          title="Quay về đầu trang"
        >
          ↑
        </button>
      )}
    </div>
  );
}