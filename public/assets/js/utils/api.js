const csrfToken = () =>
  document.querySelector('meta[name="csrf-token"]')?.content ?? '';

const parseResponse = async (res) => {
  const text = await res.text();

  try {
    const json = JSON.parse(text);

    if (res.status === 401) {
      window.location.assign('/login?expired=1');
      throw new Error('Sesión expirada');
    }

    if (!res.ok) {
      throw new Error(json.error ?? 'Error del servidor.');
    }

    const result = {
      success: json.success === true,
      data: json.data ?? [],
      error: json.error ?? null,
      meta: json.meta ?? {},
    };

    if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
      Object.assign(result, result.data);
    }

    return result;
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error('ERROR BACKEND:', text);
      throw new Error('El servidor devolvio un error. Revisa logs.');
    }

    throw e;
  }
};

export const api = {
  async get(url, params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${url}?${query}`, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    return parseResponse(res);
  },

  async post(url, body = {}) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify(body),
    });
    return parseResponse(res);
  },

  async put(url, body = {}) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify(body),
    });
    return parseResponse(res);
  },

  async delete(url) {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
    });
    return parseResponse(res);
  },
};
