/**
 * API Client – fetch wrapper with auto JWT refresh
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let accessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function subscribeToRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

async function doRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.accessToken || null;
  } catch {
    return null;
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Auto-refresh on 401
  if (res.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await doRefresh();
      isRefreshing = false;

      if (newToken) {
        accessToken = newToken;
        onTokenRefreshed(newToken);
        // Retry original request with new token
        return apiFetch(path, options);
      } else {
        accessToken = null;
        return res;
      }
    } else {
      // Queue this request until refresh is done
      return new Promise((resolve) => {
        subscribeToRefresh(() => {
          resolve(apiFetch(path, options));
        });
      });
    }
  }

  return res;
}

/** Convenience methods */
export const api = {
  get: (path: string, options?: RequestInit) =>
    apiFetch(path, { ...options, method: 'GET' }),

  post: (path: string, body?: unknown, options?: RequestInit) =>
    apiFetch(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: (path: string, body?: unknown, options?: RequestInit) =>
    apiFetch(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: (path: string, options?: RequestInit) =>
    apiFetch(path, { ...options, method: 'DELETE' }),
};
