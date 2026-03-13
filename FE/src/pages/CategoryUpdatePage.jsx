import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { updateCategoryApi, getCategoryByIdApi } from "../api/categoryApi";

export default function CategoryUpdatePage() {

  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: true
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    loadCategory();
  }, []);

  async function loadCategory() {

    const result = await getCategoryByIdApi(id);

    if (!result.ok) {
      setMessage("Cannot load category");
      return;
    }

    setForm({
      name: result.data.name || "",
      description: result.data.description || "",
      status: result.data.status
    });

  }

  function handleChange(e) {

    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });

  }

  async function handleSubmit(e) {

    e.preventDefault();

    const result = await updateCategoryApi(id, form);

    if (!result.ok) {
      setMessage(result.data?.error || "Update failed");
      return;
    }

    navigate("/category/list");

  }

  return (
    <div className="max-w-xl rounded-2xl bg-white p-6 shadow">

      <h2 className="mb-6 text-xl font-bold">
        Update Category
      </h2>

      {message && (
        <p className="text-red-500 mb-4">{message}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="status"
            checked={form.status}
            onChange={handleChange}
          />
          <label>Active</label>
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Update
        </button>

      </form>

    </div>
  );
}