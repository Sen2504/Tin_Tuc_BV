import { useEffect, useMemo, useState } from "react";
import PostEditor from "../components/PostEditor";

export default function CreatePostPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");

  const [form, setForm] = useState({
    title: "",
    hashtag: "",
    status: true,
    content: "",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const response = await fetch("http://localhost:5000/api/categories", {
      credentials: "include",
    });
    const data = await response.json();
    setCategories(data.categories || []);
  }

  const subcategories = useMemo(() => {
    const category = categories.find(
      (c) => String(c.id) === String(selectedCategoryId)
    );
    return category?.subcategories || [];
  }, [categories, selectedCategoryId]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      title: form.title,
      hashtag: form.hashtag,
      status: form.status,
      content: form.content,
      subcategory_id: Number(selectedSubcategoryId),
    };

    const response = await fetch("http://localhost:5000/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      alert(err.error || "Tạo bài viết thất bại");
      return;
    }

    const data = await response.json();
    alert(data.message || "Tạo bài viết thành công");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <input
        name="title"
        placeholder="Tiêu đề bài viết"
        value={form.title}
        onChange={handleChange}
        className="w-full rounded border p-3"
      />

      <input
        name="hashtag"
        placeholder="Hashtag"
        value={form.hashtag}
        onChange={handleChange}
        className="w-full rounded border p-3"
      />

      <select
        value={selectedCategoryId}
        onChange={(e) => {
          setSelectedCategoryId(e.target.value);
          setSelectedSubcategoryId("");
        }}
        className="w-full rounded border p-3"
      >
        <option value="">Chọn category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={selectedSubcategoryId}
        onChange={(e) => setSelectedSubcategoryId(e.target.value)}
        className="w-full rounded border p-3"
      >
        <option value="">Chọn subcategory</option>
        {subcategories.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="status"
          checked={form.status}
          onChange={handleChange}
        />
        Đăng ngay
      </label>

      <PostEditor
        value={form.content}
        onChange={(content) => setForm({ ...form, content })}
      />

      <button
        type="submit"
        className="rounded bg-sky-600 px-5 py-2 text-white"
      >
        Tạo bài viết
      </button>
    </form>
  );
}