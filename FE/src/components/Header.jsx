import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategoriesApi } from "../api/categoryApi";
import logo from "../assets/logo.png";

export default function Header() {
  const [menuItems, setMenuItems] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMobileSub, setOpenMobileSub] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const result = await getCategoriesApi();

    if (!result.ok) {
      console.error("Cannot load categories");
      return;
    }

    setMenuItems(result.data.categories || []);
  }

  return (
    <header className="w-full shadow-md">
      <div className="bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <Link
                to="/"
                aria-label="Về trang chủ"
                className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-xl border-[3px] border-sky-500 shadow-md transition hover:opacity-90"
              >
                <img
                  src={logo}
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              </Link>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
                Tỉnh Đồng Tháp
              </p>

              <h1 className="text-2xl font-extrabold leading-tight text-gray-800 lg:text-3xl">
                Bệnh viện{" "}
                <span className="text-sky-500">Phục hồi chức năng</span>
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 shadow">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-red-400">
                  Hotline cấp cứu
                </p>
                <p className="text-base font-bold text-gray-800">
                  02773 895 115
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-5 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 shadow">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-400">
                  Bác sĩ thường trực
                </p>
                <p className="text-base font-bold text-gray-800">
                  0817 666 115
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="ml-4 flex items-center justify-center rounded-xl border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100 md:hidden"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Desktop navbar */}
      <nav className="hidden bg-sky-500 md:block">
        <div className="mx-auto flex max-w-[1400px]">
          {menuItems.map((item) => (
            <div key={item.id} className="group relative flex-1">
              <Link
                to={`/${item.slug}`}
                className="flex items-center justify-center gap-1.5 border-r border-sky-400/60 px-3 py-3.5 text-[12.5px] font-bold tracking-wide text-white transition duration-200 hover:bg-sky-600 last:border-r-0"
              >
                {item.name}

                {item.subcategories?.length > 0 && (
                  <svg
                    className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </Link>

              {item.subcategories?.length > 0 && (
                <div className="invisible absolute left-0 top-full z-50 min-w-[220px] translate-y-1 rounded-b-2xl border border-sky-100 bg-white opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="overflow-hidden rounded-b-2xl py-1">
                    {item.subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/${item.slug}/${sub.slug}`}
                        className="flex items-center gap-2 border-b border-gray-50 px-5 py-2.5 text-sm text-gray-700 transition hover:bg-sky-50 hover:text-sky-600 last:border-b-0"
                      >
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400" />
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-sky-200 bg-white shadow-lg md:hidden">
          {menuItems.map((item, index) => (
            <div key={item.id} className="border-b border-gray-100">
              <div className="flex items-center justify-between px-5 py-3">
                <Link
                  to={`/${item.slug}`}
                  className="text-sm font-semibold text-gray-700 transition hover:text-sky-600"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.name}
                </Link>

                {item.subcategories?.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMobileSub(openMobileSub === index ? null : index)
                    }
                    className="ml-3 text-sm font-semibold text-gray-500 transition hover:text-sky-600"
                  >
                    {openMobileSub === index ? "▲" : "▼"}
                  </button>
                )}
              </div>

              {item.subcategories?.length > 0 && openMobileSub === index && (
                <div className="bg-sky-50 px-5 pb-3">
                  {item.subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/${item.slug}/${sub.slug}`}
                      className="block py-1.5 text-sm text-gray-600 transition hover:text-sky-600"
                      onClick={() => setMobileOpen(false)}
                    >
                      · {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}