const API_BASE = "http://localhost:5000/api";

export async function getSubCategoriesApi() {

  const res = await fetch(`${API_BASE}/subcategories`);
  const data = await res.json();

  return {
    ok: res.ok,
    data
  };

}

export async function getSubCategoryByIdApi(id) {

  const res = await fetch(`${API_BASE}/subcategories/${id}`);
  const data = await res.json();

  return {
    ok: res.ok,
    data
  };

}

export async function createSubCategoryApi(payload) {

  const res = await fetch(`${API_BASE}/subcategories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  return {
    ok: res.ok,
    data
  };

}

export async function updateSubCategoryApi(id, payload) {

  const res = await fetch(`${API_BASE}/subcategories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  return {
    ok: res.ok,
    data
  };

}