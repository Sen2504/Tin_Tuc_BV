import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCategoryApi } from "../api/categoryApi";

export default function CategoryCreatePage() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: true,
  });

  const [message, setMessage] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const result = await createCategoryApi(form);

    if (!result.ok) {
      setMessage(result.data?.error || "Create failed");
      return;
    }

    navigate("/category/list");
  }

  return (
    <div className="max-w-xl rounded-2xl bg-white p-6 shadow">

      <h2 className="mb-6 text-xl font-bold">Create Category</h2>

      {message && <p className="text-red-500">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label>Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div className="flex gap-2">
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
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create
        </button>

      </form>
    </div>
  );
}