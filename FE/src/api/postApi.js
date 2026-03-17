const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export async function getPostsBySubcategorySlugApi(categorySlug, subcategorySlug) {
  const response = await fetch(
    `${API_BASE_URL}/api/posts/${categorySlug}/${subcategorySlug}`
  );

  return parseResponse(response);
}

export async function getPostDetailBySlugApi(categorySlug, subcategorySlug, postSlug) {
  const response = await fetch(
    `${API_BASE_URL}/api/posts/${categorySlug}/${subcategorySlug}/${postSlug}`
  );

  return parseResponse(response);
}