import logo from "../assets/logo.png";

const socials = [
  {
    label: "TikTok",
    href: "#",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z" />
      </svg>
    ),
  },
  {
    label: "Zalo",
    href: "#",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 48 48" fill="currentColor">
        <text x="4" y="36" fontSize="30" fontWeight="bold">Z</text>
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="mt-10">
      {/* Main footer body */}
      <div className="bg-slate-900 text-slate-300">
        <div className="mx-auto max-w-[1400px] px-8 py-14">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 xl:grid-cols-3">

            {/* Cột 1 – Thương hiệu */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-sky-500 bg-white shadow-md">
                  <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-400">
                    Tỉnh Đồng Tháp
                  </p>
                  <h3 className="text-base font-bold leading-tight text-white">
                    Bệnh viện Phục hồi chức năng
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5 text-sm leading-relaxed">
                <div className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Số 167, Đường Tôn Đức Thắng, Phường Cao Lãnh, Tỉnh Đồng Tháp</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>02773.871.635 (TCHC) &nbsp;|&nbsp; 02773.899.066 (KHTH)</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:bvphcndt@gmail.com" className="text-sky-400 transition hover:text-sky-300 hover:underline">
                    bvphcndt@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Cột 2 – Liên hệ */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white after:mt-2 after:block after:h-[3px] after:w-10 after:rounded-full after:bg-sky-500 after:content-['']">
                Thông tin liên hệ
              </h3>
              <ul className="space-y-2.5 text-sm">
                {[
                  ["⏰", "Thứ 2 – Chủ nhật, cả ngày"],
                  ["🏥", "Hỗ trợ tư vấn &amp; tiếp nhận bệnh nhân mỗi ngày"],
                  ["🚑", "Hotline cấp cứu: 02773 895 115"],
                  ["👨‍⚕️", "Bác sĩ thường trực: 0817 666 115"],
                  ["💬", "Luôn sẵn sàng hỗ trợ phục hồi chức năng"],
                ].map(([icon, text], i) => (
                  <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="text-base">{icon}</span>
                    <span dangerouslySetInnerHTML={{ __html: text }} />
                  </li>
                ))}
              </ul>
            </div>

            {/* Cột 3 – Mạng xã hội */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white after:mt-2 after:block after:h-[3px] after:w-10 after:rounded-full after:bg-sky-500 after:content-['']">
                Kết nối với chúng tôi
              </h3>
              <p className="text-sm leading-relaxed">
                Theo dõi chúng tôi trên các nền tảng mạng xã hội để cập nhật tin tức và hoạt động của bệnh viện.
              </p>
              <div className="flex gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition duration-200 hover:border-sky-400 hover:bg-sky-500 hover:text-white"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>

              <a
                href="#"
                className="mt-2 inline-flex w-fit items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Xem phiên bản Mobile
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-sky-600">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 px-8 py-3.5 text-white md:flex-row">
          <p className="text-sm">
            <span className="italic opacity-80">Copyright © 2016</span>{" "}
            <span className="ml-1 font-semibold">Bệnh viện Phục hồi chức năng Đồng Tháp</span>
          </p>
          <p className="text-xs opacity-70">Thiết kế &amp; phát triển bởi đội ngũ IT Bệnh viện</p>
        </div>
      </div>
    </footer>
  );
}