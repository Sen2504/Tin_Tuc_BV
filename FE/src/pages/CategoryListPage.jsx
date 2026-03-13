import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategoriesApi } from "../api/categoryApi";

export default function CategoryListPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");

  async function loadCategories() {
    const result = await getCategoriesApi();

    if (!result.ok) {
      setMessage("Cannot load categories");
      return;
    }

    setCategories(result.data.categories || []);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className="rounded-2xl bg-white p-6 shadow">

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Category Management</h1>

        <button
          onClick={() => navigate("/category/create")}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Create Category
        </button>
      </div>

      {message && <p className="text-red-500">{message}</p>}

      <table className="w-full border">

        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2">ID</th>
            <th className="border px-3 py-2">Name</th>
            <th className="border px-3 py-2">Description</th>
            <th className="border px-3 py-2">Status</th>
            <th className="border px-3 py-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id}>

              <td className="border px-3 py-2">{cat.id}</td>

              <td className="border px-3 py-2">{cat.name}</td>

              <td className="border px-3 py-2">
                {cat.description || "-"}
              </td>

              <td className="border px-3 py-2">
                {cat.status ? "Active" : "Hidden"}
              </td>

              <td className="border px-3 py-2">
                <button
                  onClick={() => navigate(`/category/update/${cat.id}`)}
                  className="text-blue-600"
                >
                  Edit
                </button>
              </td>

            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}