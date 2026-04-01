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

// API cho trang quản trị, trả về dữ liệu tổng hợp để hiển thị ở list subcategory
export async function getSubCategoryListSummaryApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/subcategories/admin/list`, {
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

export async function updateSubCategoryStatusApi(id, status) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/subcategories/${id}/status`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
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

export async function getSubcategoryOptionsApi(categoryId, options = {}) {
  const params = new URLSearchParams();

  if (categoryId) {
    params.set("category_id", categoryId);
  }

  if (options.includeInactive) {
    params.set("include_inactive", "true");
  }

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/subcategories/admin/options${params.toString() ? `?${params.toString()}` : ""}`,
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