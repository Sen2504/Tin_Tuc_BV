import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getSubCategoriesApi } from "../api/subcategoryApi";

export default function SubCategoryListPage() {

  const navigate = useNavigate();

  const [subcategories, setSubcategories] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSubCategories();
  }, []);

  async function loadSubCategories() {

    const result = await getSubCategoriesApi();

    if (!result.ok) {
      setMessage("Cannot load subcategories");
      return;
    }

    setSubcategories(result.data.subcategories || []);
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow">

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">SubCategory Management</h1>

        <button
          onClick={() => navigate("/subcategory/create")}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Create SubCategory
        </button>
      </div>

      {message && <p className="text-red-500">{message}</p>}

      <table className="w-full border">

        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2">ID</th>
            <th className="border px-3 py-2">Name</th>
            <th className="border px-3 py-2">Category</th>
            <th className="border px-3 py-2">Status</th>
            <th className="border px-3 py-2">Action</th>
          </tr>
        </thead>

        <tbody>

          {subcategories.map((sub) => (

            <tr key={sub.id}>

              <td className="border px-3 py-2">{sub.id}</td>

              <td className="border px-3 py-2">{sub.name}</td>

              <td className="border px-3 py-2">
                {sub.category_name}
              </td>

              <td className="border px-3 py-2">
                {sub.status ? "Active" : "Hidden"}
              </td>

              <td className="border px-3 py-2">

                <button
                  onClick={() => navigate(`/subcategory/update/${sub.id}`)}
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