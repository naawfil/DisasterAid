const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'disasteraid.token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiRequestError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details || [];
  }
}

const request = async (path, { method = 'GET', body, auth = true } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiRequestError('Cannot reach the server. Check your connection.', 0);
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = payload.error || {};
    throw new ApiRequestError(error.message || 'Request failed', response.status, error.details);
  }

  return payload.data;
};

export const api = {
  get: (path, options) => request(path, options),
  post: (path, body, options) => request(path, { method: 'POST', body, ...options }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
};

/** CSV export — the response is a file, not JSON, so it bypasses `request`. */
export const downloadCsv = async (dataset) => {
  const response = await fetch(`${BASE_URL}/admin/export/${dataset}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!response.ok) throw new ApiRequestError('Export failed', response.status);

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `disasteraid-${dataset}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const del = (path) => request(path, { method: 'DELETE' });
