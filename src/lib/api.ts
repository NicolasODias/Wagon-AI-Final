const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string || '').replace(/\/$/, '');

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) return API_BASE_URL ? `${API_BASE_URL}/${path}` : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init);
}
