import logo from "../assets/logo.png";

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-gray-200 bg-[#f5f5f5]">
      <div className="mx-auto max-w-[1400px] px-8 py-10">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 md:grid-cols-2 xl:grid-cols-3">
          {/* Cột 1 */}
          <div className="flex h-full flex-col items-start">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-sky-500">
                <img
                src={logo}
                alt="Logo"
                className="h-full w-full object-cover"
                />
            </div>

            <h3 className="mb-4 text-base font-semibold uppercase text-slate-800">
              Bệnh viện Phục hồi chức năng
            </h3>

            <div className="space-y-2 text-sm leading-7 text-slate-600">
              <p>Số 167, Đường Tôn Đức Thắng, Phường Cao Lãnh, Tỉnh Đồng Tháp</p>
              <p>Điện thoại: 02773.871.635 (TCHC) hoặc 02773.899.066 (KHTH)</p>
              <p>
                Email:{" "}
                <a
                  href="#"
                  className="text-sky-600 transition hover:text-sky-700"
                >
                  bvphcndt@gmail.com
                </a>
              </p>
            </div>
          </div>

          {/* Cột 2 */}
          <div className="flex h-full flex-col items-start">
            <h3 className="mb-4 text-base font-semibold uppercase text-slate-800">
              Thông tin liên hệ
            </h3>

            <div className="space-y-2 text-sm leading-7 text-slate-600">
              <p>Thời gian làm việc: Thứ 2 - Chủ nhật</p>
              <p>Hỗ trợ tư vấn và tiếp nhận bệnh nhân mỗi ngày</p>
              <p>Hotline cấp cứu: 02773 895 115</p>
              <p>Bác sĩ thường trực: 0817 666 115</p>
              <p>Khu vực tiếp đón và phục hồi chức năng luôn sẵn sàng hỗ trợ.</p>
            </div>
          </div>

          {/* Cột 3 */}
          <div className="flex h-full flex-col items-start">
            <h3 className="mb-4 text-base font-semibold uppercase text-slate-800">
              Kết nối với chúng tôi
            </h3>

            <div className="mb-5 flex items-center gap-3">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400 text-sm text-white transition hover:bg-sky-500"
              >
                ♪
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400 text-sm font-bold text-white transition hover:bg-sky-500"
              >
                Z
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400 text-sm text-white transition hover:bg-sky-500"
              >
                f
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400 text-sm text-white transition hover:bg-sky-500"
              >
                ▶
              </a>
            </div>

            <a
              href="#"
              className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-sky-600"
            >
              <span className="text-lg text-sky-500">📱</span>
              <span>Xem phiên bản Mobile</span>
            </a>
          </div>
        </div>
      </div>

      <div className="bg-sky-500">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 px-8 py-3 text-white md:flex-row">
          <div className="text-sm">
            <span className="italic">Copyright © 2016</span>{" "}
            <span className="ml-2 font-semibold">
              Bệnh viện Phục hồi chức năng
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}