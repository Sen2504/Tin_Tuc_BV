const API_BASE = "http://localhost:5000/api";

export async function createUserApi(payload) {
  const res = await fetch(`${API_BASE}/users`, {
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
  const res = await fetch(`${API_BASE}/users/${userId}`, {
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
  const res = await fetch(`${API_BASE}/users`, {
    method: "GET",
    credentials: "include",
  });

  const data = await res.json();

  return {
    ok: res.ok,
    data,
  };
}