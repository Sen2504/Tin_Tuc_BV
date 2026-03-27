import { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { logoutApi, meApi } from "../api/authApi";

export default function AdminLayout({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [logoutMessage, setLogoutMessage] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    async function loadMe() {
      try {
        const result = await meApi();
        if (result.ok) {
          setCurrentUser(result.data?.user || result.data || null);
          return;
        }
        setCurrentUser(null);
      } catch (error) {
        console.error(error);
        setCurrentUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    }

    loadMe();
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
        setLogoutMessage(
          result.data?.error || result.data?.message || "Logout thất bại"
        );
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

  const userName = currentUser?.username || "Người dùng";
  const userRole = currentUser?.role || "staff";
  const isCurrentAdmin = String(currentUser?.role || "").toLowerCase() === "admin";

  const menuItems = [
    {
      label: "Tài khoản của tôi",
      path: "/user/update",
      paths: ["/user/update"],
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 20a8 8 0 0116 0"
          />
        </svg>
      ),
    },
    {
      label: "Quản lý nhân viên",
      path: "/user/list",
      paths: ["/user/list", "/user/create", "/user/edit"],
      adminOnly: true,
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 11a4 4 0 10-8 0 4 4 0 008 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 20a8 8 0 0116 0"
          />
        </svg>
      ),
    },
    {
      label: "Quản lý danh mục",
      path: "/category/list",
      paths: ["/category/list", "/category/create", "/category/update"],
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      ),
    },
    {
      label: "Quản lý danh mục con",
      path: "/subcategory/list",
      paths: ["/subcategory/list", "/subcategory/create", "/subcategory/update"],
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 7h6M5 12h14M5 17h10"
          />
          <circle cx="17" cy="7" r="2" />
        </svg>
      ),
    },
    {
      label: "Quản lý bài viết",
      path: "/post/list",
      paths: ["/post/list", "/post/create", "/post/update"],
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 9h6M9 13h6M9 17h4"
          />
        </svg>
      ),
    },
    {
      label: "Quản lý thông tin trang chủ",
      path: "/info/list",
      paths: ["/info/create", "/info/list", "/info/update"],
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
        >
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 9h8M8 13h5"
          />
          <circle cx="16.5" cy="14.5" r="1.5" />
        </svg>
      ),
    },
    {
      label: "Quản lý banner",
      path: "/banner/list",
      paths: ["/banner/list", "/banner/create", "/banner/update"],
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h8M12 8v8"
          />
        </svg>
      ),
    }
  ];

  const visibleMenuItems = menuItems.filter((item) => {
    if (item.adminOnly) {
      return isCurrentAdmin;
    }
    return true;
  });

  function isActiveMenu(paths) {
    return paths.some((path) => location.pathname.startsWith(path));
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <aside
          className={`sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden bg-slate-900 text-slate-100 shadow-2xl transition-[width,padding] duration-300 ease-in-out ${
            sidebarCollapsed ? "w-[92px] p-3" : "w-[300px] p-5"
          }`}
        >
          <div className="mb-6 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <div
                className={`transition-all duration-300 ease-in-out ${
                  sidebarCollapsed
                    ? "translate-x-2 opacity-0"
                    : "translate-x-0 opacity-100"
                }`}
              >
                <p className="whitespace-nowrap text-xs uppercase tracking-[0.25em] text-slate-400">
                  Admin Dashboard
                </p>
                <h2 className="mt-1 whitespace-nowrap text-lg font-bold text-white">
                  {isLoadingUser ? "Đang tải..." : userName}
                </h2>
                <p className="mt-1 whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-blue-300">
                  Role: {isLoadingUser ? "..." : userRole}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-100 transition hover:bg-slate-700"
              aria-label={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
              title={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            >
              <svg
                className={`h-5 w-5 transition-transform duration-300 ${
                  sidebarCollapsed ? "rotate-180" : "rotate-0"
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          <nav className="space-y-2">
            {visibleMenuItems.map((item) => {
              const active = isActiveMenu(item.paths);

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`group flex w-full items-center rounded-xl border px-3 py-3 text-left text-sm font-semibold transition-all duration-300 ${
                    active
                      ? "border-cyan-400/40 bg-cyan-400/20 text-cyan-100"
                      : "border-transparent text-slate-200 hover:border-slate-700 hover:bg-slate-800"
                  } ${sidebarCollapsed ? "justify-center" : "justify-start"}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span
                    className={`shrink-0 transition-colors duration-300 ${
                      active
                        ? "text-cyan-200"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span
                    className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                      sidebarCollapsed
                        ? "ml-0 max-w-0 translate-x-2 opacity-0"
                        : "ml-3 max-w-[220px] translate-x-0 opacity-100"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <div
              className={`overflow-hidden transition-all duration-300 ${
                sidebarCollapsed ? "max-h-0 opacity-0" : "mb-3 max-h-20 opacity-100"
              }`}
            >
              {logoutMessage && (
                <p className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300">
                  {logoutMessage}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className={`flex w-full items-center rounded-xl border border-red-300 bg-red-500 px-4 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-white hover:text-red-600 ${
                sidebarCollapsed ? "justify-center px-3" : "justify-start"
              }`}
              title={sidebarCollapsed ? "Logout" : undefined}
            >
              <svg
                className="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H9"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 20H6a2 2 0 01-2-2V6a2 2 0 012-2h7"
                />
              </svg>

              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                  sidebarCollapsed
                    ? "ml-0 max-w-0 translate-x-2 opacity-0"
                    : "ml-3 max-w-[120px] translate-x-0 opacity-100"
                }`}
              >
                Logout
              </span>
            </button>
          </div>
        </aside>

        <main className="flex-1 p-5 lg:p-8">
          <Outlet />
        </main>
      </div>

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