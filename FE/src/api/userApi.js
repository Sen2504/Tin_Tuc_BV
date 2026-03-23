const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function createUserApi(payload) {
  const res = await fetch(`${API_BASE_URL}/api/users`, {
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

export async function updateUserApi(userId, payload) {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getUsersApi() {
  const res = await fetch(`${API_BASE_URL}/api/users`, {
    method: "GET",
    credentials: "include",
  });

  const data = await res.json();

  return {
    ok: res.ok,
    data,
  };
}