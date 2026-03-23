const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function loginApi(payload) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return { ok: res.ok, data };
}

export async function logoutApi() {
  const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  const data = await res.json();
  return { ok: res.ok, data };
}

export async function meApi() {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  const data = await res.json();
  return { ok: res.ok, data };
}

export async function forgotPasswordApi(data) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    return {
      ok: res.ok,
      data: result,
    };
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      data: { message: "Network error" },
    };
  }
}