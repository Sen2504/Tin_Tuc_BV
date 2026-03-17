const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_BASE = `${API_BASE_URL}/api`;

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

export async function createSubCategoryApi(form) {
  const formData = new FormData();

  formData.append("name", form.name);
  formData.append("description", form.description || "");
  formData.append("status", String(form.status));
  formData.append("category_id", form.category_id);

  if (form.thumbnail) {
    formData.append("thumbnail", form.thumbnail);
  }

  const res = await fetch(`${API_BASE}/subcategories`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  return {
    ok: res.ok,
    data,
  };
}

export async function updateSubCategoryApi(id, form) {
  const formData = new FormData();

  if (form.name !== undefined) formData.append("name", form.name);
  if (form.description !== undefined) formData.append("description", form.description);
  if (form.status !== undefined) formData.append("status", String(form.status));
  if (form.category_id !== undefined) formData.append("category_id", form.category_id);
  if (form.remove_thumbnail !== undefined) {
    formData.append("remove_thumbnail", String(form.remove_thumbnail));
  }

  if (form.thumbnail) {
    formData.append("thumbnail", form.thumbnail);
  }

  const res = await fetch(`${API_BASE}/subcategories/${id}`, {
    method: "PUT",
    body: formData,
  });

  const data = await res.json();

  return {
    ok: res.ok,
    data,
  };
}