const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ======================API PUBLIC ra giao diện
// Lấy danh sách category đưa ra header của UI client
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

// Lấy danh sách subcategory của category theo slug để hiển thị ra trang categoryPage
// khi người dùng click vào category đó
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

// ======================API PRIVATE ra giao diện quản trị
// Lấy danh sách category dạng tóm tắt để hiển thị ra trang list
export async function getCategoryListSummaryApi(options = {}) {
  const params = new URLSearchParams();

  if (options.includeInactive) {
    params.set("include_inactive", "true");
  }

  const queryString = params.toString();

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/categories/admin/list${queryString ? `?${queryString}` : ""}`,
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

// Lấy danh sách category dạng tóm tắt để hiển thị ra dropdown khi tạo/sửa bài viết
export async function getCategoryOptionsApi(options = {}) {
  const params = new URLSearchParams();

  if (options.includeInactive) {
    params.set("include_inactive", "true");
  }

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/categories/admin/options${params.toString() ? `?${params.toString()}` : ""}`,
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

// Lấy chi tiết category theo id để hiển thị ra trang chi tiết category khi chỉnh sửa
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

// Tạo mới 1 category
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

// Cập nhật category
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

// Xóa category
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