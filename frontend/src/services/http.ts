import { getSessionHandle, getSessionToken } from '@/services/session';

const configuredApiUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000').replace(
  /\/$/,
  '',
);

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

export type ApiErrorBody = {
  message?: string;
  error?: {
    code?: string;
    message?: string;
  };
};

export class HttpRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpRequestError';
    this.status = status;
  }
}

export class ApiRequestError extends HttpRequestError {}

export const buildUrl = (path: string): string => `${API_URL}${path}`;

export const httpRequest = async <T>(path: string, options?: RequestInit): Promise<T> => {
  let response: Response;

  const bearerToken = getSessionToken();
  const sessionHeader = bearerToken ? null : getSessionHandle();

  try {
    response = await fetch(buildUrl(path), {
      ...options,
      headers: {
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(bearerToken
          ? { Authorization: `Bearer ${bearerToken}` }
          : sessionHeader
            ? { 'X-User-Handle': sessionHeader }
            : {}),
        ...(options?.headers ?? {}),
      },
    });
  } catch (error) {
    throw new Error('Unable to connect. Please try again.');
  }

  const data = (await response.json().catch(() => null)) as ApiErrorBody | null;

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `Request failed with status ${response.status}.`;
    throw new HttpRequestError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (data as T) ?? ({} as T);
};
