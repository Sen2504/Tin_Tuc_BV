const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// API PUBLIC ra giao diện
export async function getPublicInfoStatsApi(infoId) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/info-stats/public?info_id=${infoId}`,
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

// API PRIVATE ra giao diện quản trị
export async function getInfoStatsApi(infoId, includeInactive = true) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/info-stats?info_id=${infoId}&include_inactive=${includeInactive}`,
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

export async function getInfoStatByIdApi(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/info-stats/${id}`, {
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

export async function createInfoStatApi(form) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/info-stats`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        value: form.value,
        label: form.label,
        status: form.status,
        info_id: form.info_id,
      }),
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

export async function updateInfoStatApi(id, form) {
  try {
    const payload = {};

    if (form.value !== undefined) {
      payload.value = form.value;
    }

    if (form.label !== undefined) {
      payload.label = form.label;
    }

    if (form.status !== undefined) {
      payload.status = form.status;
    }

    if (form.info_id !== undefined) {
      payload.info_id = form.info_id;
    }

    const res = await fetch(`${API_BASE_URL}/api/info-stats/${id}`, {
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

export async function deleteInfoStatApi(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/info-stats/${id}`, {
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