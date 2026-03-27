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
  const response = await fetch(`${API_BASE_URL}/api/banners`, {
    method: "GET",
    credentials: "include",
  });

  return parseResponse(response);
}

export async function getBannerByIdApi(bannerId) {
  const response = await fetch(`${API_BASE_URL}/api/banners/${bannerId}`, {
    method: "GET",
    credentials: "include",
  });

  return parseResponse(response);
}

export async function createBannerApi(payload) {
  const response = await fetch(`${API_BASE_URL}/api/banners`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function updateBannerApi(bannerId, payload) {
  const response = await fetch(`${API_BASE_URL}/api/banners/${bannerId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function deleteBannerApi(bannerId) {
  const response = await fetch(`${API_BASE_URL}/api/banners/${bannerId}`, {
    method: "DELETE",
    credentials: "include",
  });

  return parseResponse(response);
}

// API PUBLIC ra client
export async function getActiveBannersPublicApi() {
  const response = await fetch(`${API_BASE_URL}/api/banners/public`, {
    method: "GET",
    credentials: "include",
  });

  return parseResponse(response);
}