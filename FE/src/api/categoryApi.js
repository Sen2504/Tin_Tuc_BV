const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// API PUBLIC ra giao diện 
export async function getCategoriesApi(options = {}) {
  const params = new URLSearchParams();

  if (options.includeInactive) {
    params.set("include_inactive", "true");
  }

  const queryString = params.toString();

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/categories${queryString ? `?${queryString}` : ""}`,
      {
        method: "GET",
        credentials: "include",
      }
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
  try {
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: "GET",
      credentials: "include",
    });

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

export async function getCategorySubcategoriesBySlugApi(categorySlug) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/categories/${categorySlug}/subcategories`,
      {
        method: "GET",
        credentials: "include",
      }
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

// API PRIVATE ra giao diện quản trị
export async function createCategoryApi(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/categories`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

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

export async function updateCategoryApi(id, payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

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

export async function deleteCategoryApi(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

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