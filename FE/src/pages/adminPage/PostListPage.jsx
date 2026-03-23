import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPostsApi, getPostByIdApi, updatePostApi } from "@/api/postApi";

function formatDate(value) {
  if (!value) return "Chưa có dữ liệu";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa có dữ liệu";
  }

  return date.toLocaleString("vi-VN");
}

export default function PostListPage() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingIds, setUpdatingIds] = useState([]);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedNextStatus, setSelectedNextStatus] = useState(null);
  const [openingEditId, setOpeningEditId] = useState(null);

  async function loadPosts() {
    setLoading(true);
    setMessage("");

    const result = await getPostsApi({ includeInactive: true });

    if (!result.ok) {
      setMessage(result.data?.error || "Cannot load posts");
      setLoading(false);
      return;
    }

    setPosts(result.data.posts || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function handleOpenConfirm(postId, nextValue) {
    const nextStatus = nextValue === "active";
    const currentPost = posts.find((post) => post.id === postId);

    if (!currentPost || currentPost.status === nextStatus) {
      return;
    }

    setSelectedPost(currentPost);
    setSelectedNextStatus(nextStatus);
    setConfirmModalOpen(true);
  }

  function handleCloseConfirm() {
    setConfirmModalOpen(false);
    setSelectedPost(null);
    setSelectedNextStatus(null);
  }

  async function handleConfirmStatusChange() {
    if (!selectedPost || selectedNextStatus === null) return;

    const postId = selectedPost.id;
    const oldStatus = selectedPost.status;
    const nextStatus = selectedNextStatus;

    setUpdatingIds((prev) => [...prev, postId]);
    setMessage("");

    handleCloseConfirm();

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, status: nextStatus }
          : post
      )
    );

    const result = await updatePostApi(postId, { status: nextStatus });

    if (!result.ok) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, status: oldStatus }
            : post
        )
      );

      setMessage(result.data?.error || "Cannot update post status");
      setUpdatingIds((prev) => prev.filter((id) => id !== postId));
      return;
    }

    const updatedPost = result.data?.post;

    if (updatedPost) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, ...updatedPost }
            : post
        )
      );
    }

    setUpdatingIds((prev) => prev.filter((id) => id !== postId));
  }

  async function handleEdit(post) {
    setOpeningEditId(post.id);
    setMessage("");

    const result = await getPostByIdApi(post.id);

    if (!result.ok) {
      setMessage(result.data?.error || "Không lấy được chi tiết bài viết");
      setOpeningEditId(null);
      return;
    }

    navigate(`/post/update/${post.id}`, {
      state: {
        post: result.data?.post || null,
      },
    });

    setOpeningEditId(null);
  }

  function handleClearFilters() {
    setCategoryFilter("all");
    setSubcategoryFilter("all");
    setStatusFilter("all");
    setSearchTerm("");
  }

  const categoryOptions = useMemo(() => {
    const map = new Map();

    posts.forEach((post) => {
      const categoryId = post.category?.id;
      const categoryName = post.category?.name;

      if (categoryId && categoryName) {
        map.set(String(categoryId), categoryName);
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [posts]);

  const subcategoryOptions = useMemo(() => {
    const map = new Map();

    posts.forEach((post) => {
      const categoryId = String(post.category?.id || "");

      if (categoryFilter !== "all" && categoryId !== categoryFilter) {
        return;
      }

      const subcategoryId = post.subcategory?.id;
      const subcategoryName = post.subcategory?.name;

      if (subcategoryId && subcategoryName) {
        map.set(String(subcategoryId), subcategoryName);
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [posts, categoryFilter]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch = [
        String(post.id),
        post.title,
        post.slug,
        post.hashtag,
        post.excerpt,
        post.category?.name,
        post.subcategory?.name,
        post.author?.username,
      ]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? post.status
            : !post.status;

      const matchesCategory =
        categoryFilter === "all"
          ? true
          : String(post.category?.id || "") === categoryFilter;

      const matchesSubcategory =
        subcategoryFilter === "all"
          ? true
          : String(post.subcategory?.id || "") === subcategoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesSubcategory
      );
    });
  }, [posts, searchTerm, statusFilter, categoryFilter, subcategoryFilter]);

  const totalCount = posts.length;
  const activeCount = posts.filter((post) => post.status).length;
  const inactiveCount = totalCount - activeCount;

  const isConfirming =
    selectedPost && updatingIds.includes(selectedPost.id);

  return (
    <>
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.75)]">
          <div className="flex flex-col gap-6 px-6 py-7 lg:flex-row lg:items-end lg:justify-between lg:px-8">
            <div className="max-w-2xl">
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white lg:text-4xl">
                Quản lý bài viết
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Theo dõi toàn bộ bài viết, tìm kiếm nhanh theo tiêu đề hoặc slug
                và đổi active hoặc inactive trực tiếp ngay trên bảng quản lý.
              </p>
            </div>

            <button
              onClick={() => navigate("/post/create")}
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              + Tạo bài viết mới
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <p className="text-sm font-semibold text-slate-500">Tổng bài viết</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{totalCount}</p>
            <p className="mt-2 text-sm text-slate-500">Toàn bộ dữ liệu đang quản lý</p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm shadow-emerald-100/70">
            <p className="text-sm font-semibold text-emerald-700">Đang hiển thị</p>
            <p className="mt-3 text-3xl font-black text-emerald-900">{activeCount}</p>
            <p className="mt-2 text-sm text-emerald-700/80">Đang hiển thị ngoài giao diện</p>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm shadow-amber-100/70">
            <p className="text-sm font-semibold text-amber-700">Đã ẩn</p>
            <p className="mt-3 text-3xl font-black text-amber-900">{inactiveCount}</p>
            <p className="mt-2 text-sm text-amber-700/80">Đã ẩn nhưng vẫn còn trong CSDL</p>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.55)] lg:p-6">
          <div className="mb-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <h2 className="shrink-0 text-xl font-black text-slate-900">
                Danh sách bài viết
              </h2>

              <div className="flex flex-wrap items-center gap-3 xl:ml-auto xl:justify-end">
                <select
                  value={categoryFilter}
                  onChange={(event) => {
                    setCategoryFilter(event.target.value);
                    setSubcategoryFilter("all");
                  }}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400"
                >
                  <option value="all">Tất cả category</option>
                  {categoryOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>

                <select
                  value={subcategoryFilter}
                  onChange={(event) => setSubcategoryFilter(event.target.value)}
                  disabled={categoryFilter === "all"}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="all">Tất cả subcategory</option>
                  {subcategoryOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400"
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm theo id, tiêu đề, slug"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white sm:w-[220px] xl:w-[260px]"
                />

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {message}
            </div>
          )}

          <div className="overflow-hidden rounded-[24px] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase text-slate-500">
                      Bài viết
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase text-slate-500">
                      Danh mục
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase text-slate-500">
                      Tác giả
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase text-slate-500">
                      Trạng thái
                    </th>
                    <th className="w-[170px] px-5 py-4 text-left text-[11px] font-bold uppercase text-zinc-500">
                      Hành động
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-14 text-center text-sm font-medium text-slate-500">
                        Đang tải bài viết...
                      </td>
                    </tr>
                  ) : filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-14 text-center text-sm font-medium text-slate-500">
                        Không tìm thấy bài viết nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((post) => {
                      const isUpdating = updatingIds.includes(post.id);

                      return (
                        <tr key={post.id} className="transition hover:bg-slate-50/80">
                          <td className="px-5 py-4 align-top">
                            <div className="flex items-start gap-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-black uppercase text-white shadow-lg shadow-cyan-500/20">
                                {post.title?.slice(0, 1) || "P"}
                              </div>

                              <div className="max-w-md">
                                <p className="text-sm font-bold text-slate-900">
                                  {post.title}
                                </p>

                                <p className="mt-1 text-[11px] font-semibold uppercase text-cyan-700">
                                  /{post.slug}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <div className="space-y-2 text-xs text-slate-600">
                              <p>
                                <span className="font-semibold text-slate-900">Category:</span>{" "}
                                {post.category?.name || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-900">Subcategory:</span>{" "}
                                {post.subcategory?.name || "N/A"}
                              </p>
                              <p className="text-xs text-slate-500">
                                Tạo lúc: {formatDate(post.create_at)}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <div className="space-y-2 text-xs text-slate-600">
                              <p className="font-semibold text-slate-900">
                                {post.author?.username || "Unknown"}
                              </p>
                              <p className="text-xs text-slate-500">
                                Cập nhật: {formatDate(post.update_at)}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <select
                              value={post.status ? "active" : "inactive"}
                              onChange={(event) =>
                                handleOpenConfirm(post.id, event.target.value)
                              }
                              disabled={isUpdating}
                              className={`w-full min-w-36 rounded-2xl border px-4 py-2.5 text-sm font-semibold outline-none transition ${
                                post.status
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                              } ${isUpdating ? "cursor-not-allowed opacity-70" : "focus:border-cyan-400"}`}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </td>

                          <td className="w-[170px] px-5 py-4 align-top text-left">
                            <button
                              onClick={() => navigate(`/post/update/${post.id}`)}
                              className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100"
                            >
                              Chỉnh sửa
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Đang hiển thị {filteredPosts.length} / {totalCount} bài viết
            </p>
          </div>
        </div>
      </section>

      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">
              Xác nhận thay đổi trạng thái
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Bạn có chắc muốn chuyển bài viết{" "}
              <span className="font-bold text-slate-900">
                {selectedPost?.title}
              </span>{" "}
              sang trạng thái{" "}
              <span
                className={`font-bold ${
                  selectedNextStatus ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {selectedNextStatus ? "Active" : "Inactive"}
              </span>{" "}
              không?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseConfirm}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={isConfirming}
                className="rounded-2xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isConfirming ? "Đang cập nhật..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}