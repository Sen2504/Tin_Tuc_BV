const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// API PUBLIC ra giao diện
export async function getPublicInfosApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/infos/public`, {
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

// API PRIVATE ra giao diện quản trị
export async function getInfosApi(includeInactive = false) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/infos?include_inactive=${includeInactive}`,
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

export async function getInfoByIdApi(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/infos/${id}`, {
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

export async function createInfoApi(form) {
  try {
    const formData = new FormData();

    formData.append("title", form.title);
    formData.append("slogan", form.slogan || "");
    formData.append("description", form.description || "");
    formData.append("status", String(form.status));

    if (form.image) {
      formData.append("image", form.image);
    }

    const res = await fetch(`${API_BASE_URL}/api/infos`, {
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

export async function updateInfoApi(id, form) {
  try {
    const formData = new FormData();

    if (form.title !== undefined) {
      formData.append("title", form.title);
    }

    if (form.slogan !== undefined) {
      formData.append("slogan", form.slogan);
    }

    if (form.description !== undefined) {
      formData.append("description", form.description);
    }

    if (form.status !== undefined) {
      formData.append("status", String(form.status));
    }

    if (form.remove_image !== undefined) {
      formData.append("remove_image", String(form.remove_image));
    }

    if (form.image) {
      formData.append("image", form.image);
    }

    const res = await fetch(`${API_BASE_URL}/api/infos/${id}`, {
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

export async function deleteInfoApi(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/infos/${id}`, {
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