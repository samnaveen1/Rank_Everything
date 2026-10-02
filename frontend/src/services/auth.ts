import { httpRequest } from '@/services/http';

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

export const registerAccount = (input: {
  name: string;
  email: string;
  handle: string;
  password: string;
}): Promise<AuthResponse> =>
  httpRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const loginAccount = (input: {
  identifier?: string;
  email?: string;
  handle?: string;
  password: string;
}): Promise<AuthResponse> =>
  httpRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const loginWithGoogle = (input: {
  accessToken: string;
}): Promise<AuthResponse> =>
  httpRequest<AuthResponse>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const loadCurrentAuthUser = (): Promise<AuthUser> =>
  httpRequest<AuthUser>('/api/auth/me');

export const logoutAccount = async (): Promise<void> => {
  await httpRequest<void>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
};
