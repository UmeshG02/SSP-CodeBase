export const API_URL = 'http://localhost:3001';

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: any;
}

export async function apiFetch(endpoint: string, options: ApiOptions = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ssp_token') : null;

  const headers: HeadersInit = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let body = options.body;
  if (
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof URLSearchParams)
  ) {
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    body,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
}
