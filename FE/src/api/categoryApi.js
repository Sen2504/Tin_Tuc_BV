const API_BASE = "http://localhost:5000/api";

export async function getCategoriesApi(options = {}) {
  const params = new URLSearchParams();

  if (options.includeInactive) {
    params.set("include_inactive", "true");
  }

  const queryString = params.toString();

  try {
    const res = await fetch(
      `${API_BASE}/categories${queryString ? `?${queryString}` : ""}`
    );

    const data = await res.json();

    return {
      ok: res.ok,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      data: { error: "Server connection error" },
    };
  }
}

export async function getCategoryByIdApi(id) {

  const res = await fetch(`http://localhost:5000/api/categories/${id}`);

  const data = await res.json();

  return {
    ok: res.ok,
    data
  };
}

export async function createCategoryApi(payload) {
  const res = await fetch(`${API_BASE}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  return { ok: res.ok, data };
}

export async function updateCategoryApi(id, payload) {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  return { ok: res.ok, data };
}

export async function getCategorySubcategoriesBySlugApi(categorySlug) {
  try {
    const res = await fetch(`${API_BASE}/categories/${categorySlug}/subcategories`);
    const data = await res.json();

    return {
      ok: res.ok,
      data,
    };
  } catch {
    return {
      ok: false,
      data: { error: "Network error" },
    };
  }
}