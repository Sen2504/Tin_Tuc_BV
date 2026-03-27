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
  const response = await fetch(`${API_BASE_URL}/api/banner-items`, {
    method: "GET",
    credentials: "include",
  });

  return parseResponse(response);
}

export async function getBannerItemByIdApi(itemId) {
  const response = await fetch(`${API_BASE_URL}/api/banner-items/${itemId}`, {
    method: "GET",
    credentials: "include",
  });

  return parseResponse(response);
}

export async function createBannerItemApi(formData) {
  const response = await fetch(`${API_BASE_URL}/api/banner-items`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return parseResponse(response);
}

export async function updateBannerItemApi(itemId, formData) {
  const response = await fetch(`${API_BASE_URL}/api/banner-items/${itemId}`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });

  return parseResponse(response);
}

export async function deleteBannerItemApi(itemId) {
  const response = await fetch(`${API_BASE_URL}/api/banner-items/${itemId}`, {
    method: "DELETE",
    credentials: "include",
  });

  return parseResponse(response);
}