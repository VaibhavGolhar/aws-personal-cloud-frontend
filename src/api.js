const API_BASE = "http://localhost:8080/api";

export async function apiFetch(path, options = {}, token = null) {
  const headers = options.headers || {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) headers["Accept"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}