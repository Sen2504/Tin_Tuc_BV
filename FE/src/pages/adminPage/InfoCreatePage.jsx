import { useEffect, useMemo, useState } from "react";
import { createInfoApi, deleteInfoApi } from "@/api/infoApi";
import { createInfoStatApi } from "@/api/info_statApi";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Layers,
  Sparkles,
} from "lucide-react";

const initialStatItem = {
  label: "",
  value: "",
  status: true,
};

export default function InfoCreatePage() {
  const [form, setForm] = useState({
    title: "",
    slogan: "",
    description: "",
    status: true,
    image: null,
  });

  const [infoStats, setInfoStats] = useState([{ ...initialStatItem }]);
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  function handleChangeForm(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0] || null;

    setForm((prev) => ({
      ...prev,
      image: file,
    }));

    setPreviewImage((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return file ? URL.createObjectURL(file) : "";
    });
  }

  function handleAddInfoStat() {
    setInfoStats((prev) => [...prev, { ...initialStatItem }]);
  }

  function handleRemoveInfoStat(index) {
    setInfoStats((prev) => prev.filter((_, i) => i !== index));
  }

  function handleChangeInfoStat(index, field, value) {
    setInfoStats((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          [field]: value,
        };
      })
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorText("");

    try {
      const filteredStats = infoStats.filter(
        (item) => item.label.trim() !== "" && item.value.trim() !== ""
      );

      const infoPayload = {
        title: form.title,
        slogan: form.slogan,
        description: form.description,
        status: form.status,
        image: form.image,
      };

      const createInfoRes = await createInfoApi(infoPayload);

      if (!createInfoRes.ok) {
        setErrorText(
          createInfoRes.data?.message ||
            createInfoRes.data?.error ||
            "Tạo info thất bại"
        );
        setLoading(false);
        return;
      }

      const createdInfo = createInfoRes.data?.info;
      const infoId = createdInfo?.id;

      if (!infoId) {
        setErrorText("Không lấy được ID của info vừa tạo");
        setLoading(false);
        return;
      }

      for (const stat of filteredStats) {
        const createStatRes = await createInfoStatApi({
          label: stat.label,
          value: stat.value,
          status: stat.status,
          info_id: infoId,
        });

        if (!createStatRes.ok) {
          await deleteInfoApi(infoId);

          setErrorText(
            createStatRes.data?.message ||
              createStatRes.data?.error ||
              "Tạo info_stat thất bại"
          );
          setLoading(false);
          return;
        }
      }

      setMessage("Tạo info và info_stat thành công");

      setForm({
        title: "",
        slogan: "",
        description: "",
        status: true,
        image: null,
      });

      setInfoStats([{ ...initialStatItem }]);
      setPreviewImage("");

      const fileInput = document.getElementById("info-image-input");
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      setErrorText("Có lỗi xảy ra trong quá trình tạo dữ liệu");
    }

    setLoading(false);
  }

  const activeStatCount = useMemo(() => {
    return infoStats.filter((item) => item.status).length;
  }, [infoStats]);

  const filledStatCount = useMemo(() => {
    return infoStats.filter(
      (item) => item.label.trim() !== "" && item.value.trim() !== ""
    ).length;
  }, [infoStats]);

  const completionPercent = useMemo(() => {
    let score = 0;
    if (form.title.trim()) score += 34;
    if (form.description.trim()) score += 33;
    if (filledStatCount > 0) score += 33;
    return score;
  }, [form.title, form.description, filledStatCount]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#cffafe,_#f8fafc_35%,_#f8fafc)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative mb-6 overflow-hidden rounded-3xl border border-cyan-100 bg-white/90 p-6 shadow-[0_20px_50px_-35px_rgba(8,145,178,0.55)] backdrop-blur">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-100 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-14 left-10 h-36 w-36 rounded-full bg-emerald-100 blur-2xl" />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                <Sparkles className="h-3.5 w-3.5" />
                Homepage Info
              </p>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Tạo thông tin trang chủ
              </h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Thông tin chính
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Nội dung sẽ hiển thị trên block info của trang chủ
                  </p>
                </div>
              </div>

              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChangeForm}
                    placeholder="Ví dụ: BỆNH VIỆN PHỤC HỒI CHỨC NĂNG "
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Slogan
                  </label>
                  <input
                    type="text"
                    name="slogan"
                    value={form.slogan}
                    onChange={handleChangeForm}
                    placeholder="Ví dụ: Đồng hành cùng sức khỏe cộng đồng"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Mô tả
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChangeForm}
                    placeholder="Nhập mô tả ngắn cho block info..."
                    rows={6}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-cyan-50 px-4 py-4">
                  <label
                    htmlFor="status"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Trạng thái hiển thị
                  </label>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <select
                      id="status"
                      name="status"
                      value={form.status ? "active" : "inactive"}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          status: e.target.value === "active",
                        }))
                      }
                      className="min-w-[220px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    >
                      <option value="active">Hiển thị</option>
                      <option value="inactive">Ẩn</option>
                    </select>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                      {form.status ? "Đang bật" : "Đang tắt"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Danh sách số liệu (info stats)
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Thêm các số liệu như năm kinh nghiệm, số bệnh nhân, số bác sĩ...
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddInfoStat}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <Layers className="h-4 w-4" />
                  Thêm info stat
                </button>
              </div>

              <div className="space-y-4">
                {infoStats.map((item, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"
                  >
                    <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700">
                          #{index + 1}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                            Info stat
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Nhập label và value để hiển thị trên trang chủ
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                          <input
                            type="checkbox"
                            checked={item.status}
                            onChange={(e) =>
                              handleChangeInfoStat(
                                index,
                                "status",
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                          />
                          Hiển thị
                        </label>

                        {infoStats.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveInfoStat(index)}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            Xóa
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-4 p-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Label
                        </label>
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) =>
                            handleChangeInfoStat(index, "label", e.target.value)
                          }
                          placeholder="Ví dụ: Bệnh nhân mỗi năm"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Value
                        </label>
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) =>
                            handleChangeInfoStat(index, "value", e.target.value)
                          }
                          placeholder="Vi du: 2000+"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Hình nền
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Upload hình ảnh để hiển thị cùng block info trên trang chủ.
                </p>
              </div>

              <div className="space-y-4">
                <label className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-cyan-400 hover:bg-cyan-50">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm transition group-hover:scale-105">
                    <ImagePlus className="h-7 w-7 text-cyan-600" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      Chọn ảnh từ máy tính
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Hỗ trợ JPG, PNG, WEBP, GIF
                    </p>
                  </div>

                  <input
                    id="info-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="h-72 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-72 flex-col items-center justify-center px-6 text-center">
                      <div className="mb-3 rounded-2xl bg-slate-200 p-4 text-slate-500">
                        <ImagePlus className="h-8 w-8" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600">
                        Chưa có hình ảnh nào được chọn
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Hình ảnh preview sẽ hiển thị ở đây
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                {loading ? "Dang tao du lieu..." : "Tạo info"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}