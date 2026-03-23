const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// API PUBLIC ra giao diện
export async function getSubCategoriesApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/subcategories`, {
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

export async function getSubCategoryByIdApi(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/subcategories/${id}`, {
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

// API PRIVATE ra giao diện quản trị
export async function createSubCategoryApi(form) {
  try {
    const formData = new FormData();

    formData.append("name", form.name);
    formData.append("description", form.description || "");
    formData.append("status", String(form.status));
    formData.append("category_id", form.category_id);

    if (form.thumbnail) {
      formData.append("thumbnail", form.thumbnail);
    }

    const res = await fetch(`${API_BASE_URL}/api/subcategories`, {
      method: "POST",
      credentials: "include",
      body: formData,
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

export async function updateSubCategoryApi(id, form) {
  try {
    const formData = new FormData();

    if (form.name !== undefined) {
      formData.append("name", form.name);
    }

    if (form.description !== undefined) {
      formData.append("description", form.description);
    }

    if (form.status !== undefined) {
      formData.append("status", String(form.status));
    }

    if (form.category_id !== undefined) {
      formData.append("category_id", form.category_id);
    }

    if (form.remove_thumbnail !== undefined) {
      formData.append("remove_thumbnail", String(form.remove_thumbnail));
    }

    if (form.thumbnail) {
      formData.append("thumbnail", form.thumbnail);
    }

    const res = await fetch(`${API_BASE_URL}/api/subcategories/${id}`, {
      method: "PUT",
      credentials: "include",
      body: formData,
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

export async function deleteSubCategoryApi(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/subcategories/${id}`, {
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