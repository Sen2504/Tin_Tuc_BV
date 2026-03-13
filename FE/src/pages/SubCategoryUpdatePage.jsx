import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  updateSubCategoryApi,
  getSubCategoryByIdApi
} from "../api/subcategoryApi";

const API_BASE = "http://localhost:5000/api";

export default function SubCategoryUpdatePage() {

  const navigate = useNavigate();
  const { id } = useParams();

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
    loadSubCategory();

  }, []);

  async function loadCategories() {

    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();

    setCategories(data.categories || []);

  }

  async function loadSubCategory() {

    const result = await getSubCategoryByIdApi(id);

    if (!result.ok) {
      setMessage("Cannot load subcategory");
      return;
    }

    setForm(result.data);

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

    const result = await updateSubCategoryApi(id, form);

    if (!result.ok) {
      setMessage(result.data?.error || "Update failed");
      return;
    }

    navigate("/subcategory/list");

  }

  return (

    <div className="max-w-xl rounded-2xl bg-white p-6 shadow">

      <h2 className="mb-6 text-xl font-bold">
        Update SubCategory
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
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Update
        </button>

      </form>

    </div>

  );

}