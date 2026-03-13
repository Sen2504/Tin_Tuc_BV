import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createSubCategoryApi } from "../api/subcategoryApi";

const API_BASE = "http://localhost:5000/api";

export default function SubCategoryCreatePage() {

  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
    status: true
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {

    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();

    setCategories(data.categories || []);

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

    const result = await createSubCategoryApi(form);

    if (!result.ok) {
      setMessage(result.data?.error || "Create failed");
      return;
    }

    navigate("/subcategory/list");

  }

  return (

    <div className="max-w-xl rounded-2xl bg-white p-6 shadow">

      <h2 className="mb-6 text-xl font-bold">
        Create SubCategory
      </h2>

      {message && (
        <p className="text-red-500 mb-4">{message}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label>Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
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

        <div>
          <label>Category</label>

          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >

            <option value="">Select category</option>

            {categories.map((cat) => (

              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>

            ))}

          </select>

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