import logo from "../assets/logo.png";

const menuItems = [
  {
    label: "TÌM BÁC SĨ",
    link: "#",
  },
  {
    label: "GIỚI THIỆU",
    link: "#",
    children: [
      "Tổng quan",
      "Nền tảng",
      "Triết lý",
      "Sứ mệnh",
      "Văn hóa công ty",
      "Văn hóa kinh doanh",
      "Slogan",
      "Sơ đồ tổ chức",
      "Ban lãnh đạo",
    ],
  },
  {
    label: "CHUYÊN KHOA",
    link: "#",
    children: [
      "Khoa nội",
      "Khoa ngoại",
      "Khoa nhi",
      "Khoa sản",
    ],
  },
  {
    label: "DỊCH VỤ Y TẾ",
    link: "#",
  },
  {
    label: "DV HỖ TRỢ BN",
    link: "#",
  },
  {
    label: "TIN TỨC",
    link: "#",
  },
  {
    label: "TUYỂN DỤNG",
    link: "#",
  },
  {
    label: "LIÊN HỆ",
    link: "#",
  },
];

export default function Header() {
  return (
    <header className="w-full shadow-sm">
      {/* Top header */}
      <div className="bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5">
          {/* Left */}
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-sky-500">
                    <img
                    src={logo}
                    alt="Logo"
                    className="h-full w-full object-contain"
                    />
                </div>
                <span className="mt-2 text-sm font-semibold text-sky-500">
                    {/* Tất cả cho sức khỏe bạn */}
                </span>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold uppercase tracking-wide text-sky-500">
                Bệnh viện
              </h1>
              <h1 className="text-3xl font-extrabold uppercase tracking-wide text-sky-500">
                PHỤC HỒI CHỨC NĂNG ĐỒNG THÁP
              </h1>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm text-sky-500">Hotline cấp cứu</p>
                <p className="text-lg text-gray-700">02773 895 115</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-sky-500">Bác sĩ thường trực</p>
              <p className="text-lg text-gray-700">0817 666 115</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="bg-sky-500">
        <div className="mx-auto flex max-w-[1400px]">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className="group relative border-r border-sky-400 last:border-r-0"
            >
              <a
                href={item.link}
                className="flex min-w-[140px] items-center justify-center px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
              >
                {item.label}
                {item.children && <span className="ml-2">▼</span>}
              </a>

              {item.children && (
                <div className="invisible absolute left-0 top-full z-50 w-72 translate-y-2 opacity-0 shadow-lg transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="bg-white">
                    {item.children.map((child, childIndex) => (
                      <a
                        key={childIndex}
                        href="#"
                        className="block border-b border-gray-100 px-4 py-2.5 text-[14px] text-gray-700 transition hover:bg-sky-50 hover:text-sky-600"
                      >
                        {child}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </header>
  );
}