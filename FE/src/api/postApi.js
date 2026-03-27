const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

// API PUBLIC ra giao diện
export async function getPostsBySubcategorySlugApi(categorySlug, subcategorySlug) {
  const response = await fetch(
    `${API_BASE_URL}/api/posts/${categorySlug}/${subcategorySlug}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  return parseResponse(response);
}

export async function getPostDetailBySlugApi(categorySlug, subcategorySlug, postSlug) {
  const response = await fetch(
    `${API_BASE_URL}/api/posts/${categorySlug}/${subcategorySlug}/${postSlug}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  return parseResponse(response);
}

// API PRIVATE ra giao diện quản trị
export async function getPostByIdApi(postId) {
  const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: "GET",
    credentials: "include",
  });

  return parseResponse(response);
}

export async function createPostApi(formData) {
  const response = await fetch(`${API_BASE_URL}/api/posts`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return parseResponse(response);
}

export async function updatePostApi(postId, formData) {
  const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });

  return parseResponse(response);
}

export async function deletePostApi(postId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
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

// API dùng chung cho cả giao diện người dùng và quản trị
export async function getPostsApi(options = {}) {
  const params = new URLSearchParams();

  if (options.includeInactive) {
    params.set("include_inactive", "true");
  }

  const queryString = params.toString();

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/posts${queryString ? `?${queryString}` : ""}`,
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