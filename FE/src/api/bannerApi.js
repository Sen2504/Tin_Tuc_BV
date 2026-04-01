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
export async function getBannersApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/banners`, {
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

export async function getBannerByIdApi(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/banners/${id}`, {
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

export async function createBannerApi(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/banners`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
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

export async function createBannerFullApi(formData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/banners/full`, {
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

export async function updateBannerApi(id, payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/banners/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
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

export async function deleteBannerApi(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/banners/${id}`, {
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

// API PUBLIC ra client
export async function getActiveBannersPublicApi() {
  const response = await fetch(`${API_BASE_URL}/api/banners/public`, {
    method: "GET",
    credentials: "include",
  });

  return parseResponse(response);
}