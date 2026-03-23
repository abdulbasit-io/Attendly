const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(`${API_URL}${endpoint}`, config);

  // Token expired — try refresh
  if (res.status === 401 && token) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const retryConfig = {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        } as Record<string, string>,
      };
      const retryRes = await fetch(`${API_URL}${endpoint}`, retryConfig);
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({}));
        throw new ApiError(err.error || 'Request failed', retryRes.status);
      }
      return retryRes.json();
    } else {
      // Refresh failed — clear tokens and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
      }
      throw new ApiError('Session expired', 401);
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err.error || 'Request failed', res.status);
  }

  return res.json();
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const { accessToken } = await res.json();
    localStorage.setItem('accessToken', accessToken);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) => request<T>(endpoint, { method: 'POST', body }),
  put: <T>(endpoint: string, body: unknown) => request<T>(endpoint, { method: 'PUT', body }),
  patch: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'PATCH', body }),
  del: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

export { ApiError };
