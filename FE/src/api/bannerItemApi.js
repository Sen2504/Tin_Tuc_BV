const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

// API PRIVATE quản trị
export async function getBannerItemsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/banner-items`, {
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

export async function getBannerItemByIdApi(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/banner-items/${id}`, {
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

export async function createBannerItemApi(formData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/banner-items`, {
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

export async function updateBannerItemApi(id, formData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/banner-items/${id}`, {
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

export async function deleteBannerItemApi(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/banner-items/${id}`, {
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