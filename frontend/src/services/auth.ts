import { getSessionToken } from '@/services/session';

const configuredApiUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

const API_URL = (() => {
  if (typeof window === 'undefined') {
    return configuredApiUrl;
  }

  const apiUrl = new URL(configuredApiUrl);
  const isLocalApi = apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1';

  if (isLocalApi && window.location.hostname) {
    apiUrl.hostname = window.location.hostname;
  }

  return apiUrl.toString().replace(/\/$/, '');
})();

export type AuthUser = {
  id: string;
  handle: string;
  name: string;
  email: string;
  avatarUrl: string;
  provider: 'local' | 'google';
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

const request = async <T>(path: string, body?: Record<string, string | boolean | undefined>): Promise<T> => {
  const token = getSessionToken();
  const response = await fetch(`${API_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok) {
    throw new Error((data && typeof data.message === 'string' ? data.message : 'Authentication failed.'));
  }

  return data as T;
};

export const registerAccount = (input: {
  name: string;
  email: string;
  handle: string;
  password: string;
}): Promise<AuthResponse> => request<AuthResponse>('/api/auth/register', input);

export const loginAccount = (input: {
  identifier?: string;
  email?: string;
  handle?: string;
  password: string;
}): Promise<AuthResponse> => request<AuthResponse>('/api/auth/login', input);

export const loginWithGoogle = (input: {
  accessToken: string;
}): Promise<AuthResponse> => request<AuthResponse>('/api/auth/google', input);

export const loadCurrentAuthUser = (): Promise<AuthUser> => request<AuthUser>('/api/auth/me');

export const logoutAccount = async (): Promise<void> => {
  const token = getSessionToken();
  const response = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? 'Logout failed.');
  }
};
