import { getSessionHandle, getSessionToken } from '@/services/session';
import {
    ActivityItem,
    ActivityPage,
    LeaderboardEntry,
} from '@/types/community';
import {
    RankingInput,
    RankingItem,
    RankingPage,
    RatingBreakdown,
} from '@/types/item';
import { ProfileGroup, UserProfile, UserStats } from '@/types/user';

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

type ApiError = {
  message?: string;
};

class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  let response: Response;

  // Identifies the acting user server-side. Without it the API falls back to
  // its configured default handle, which keeps logged-out states working.
  const sessionHeader = getSessionHandle();
  const bearerToken = getSessionToken();

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(sessionHeader ? { 'X-User-Handle': sessionHeader } : {}),
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
        ...(options?.headers ?? {}),
      },
    });
  } catch (error) {
    console.error('RANK.io API request failed', {
      url: `${API_URL}${path}`,
      message: error instanceof Error ? error.message : String(error),
    });
    throw new Error(`Cannot connect to the API at ${API_URL}. Start the backend and try again.`);
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(
      errorBody?.message ?? `Request failed with status ${response.status}.`,
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

const toQuery = (params: Record<string, string | number | undefined>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
};

/* Rankings ---------------------------------------------------------------- */

export type ListRankingsOptions = {
  category?: string;
  query?: string;
  author?: string;
  sort?: 'rating' | 'recent';
  page?: number;
  pageSize?: number;
};

export const loadRankings = (options: ListRankingsOptions = {}): Promise<RankingPage> =>
  request<RankingPage>(`/api/rankings${toQuery({ ...options })}`);

export const loadRanking = (id: string): Promise<RankingItem> =>
  request<RankingItem>(`/api/rankings/${encodeURIComponent(id)}`);

export const createRanking = (input: RankingInput): Promise<RankingItem> =>
  request<RankingItem>('/api/rankings', { method: 'POST', body: JSON.stringify(input) });

export const updateRanking = (id: string, input: Partial<RankingInput>): Promise<RankingItem> =>
  request<RankingItem>(`/api/rankings/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

export const deleteRanking = (id: string): Promise<void> =>
  request<void>(`/api/rankings/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const loadRatingBreakdown = (id: string): Promise<RatingBreakdown> =>
  request<RatingBreakdown>(`/api/rankings/${encodeURIComponent(id)}/ratings`);

export const loadCategories = (): Promise<string[]> => request<string[]>('/api/categories');

export const loadTags = (): Promise<string[]> => request<string[]>('/api/tags');

/* Profile ---------------------------------------------------------------- */

export const loadCurrentUser = (): Promise<UserProfile> => request<UserProfile>('/api/users/me');

export const loadUser = (handle: string): Promise<UserProfile> =>
  request<UserProfile>(`/api/users/${encodeURIComponent(handle)}`);

export const loadUserStats = (handle: string): Promise<UserStats> =>
  request<UserStats>(`/api/users/${encodeURIComponent(handle)}/stats`);

/** Reduced ranking shape used by the profile grid, which only needs a cover. */
export type ProfileRankingSummary = Pick<
  RankingItem,
  'id' | 'title' | 'category' | 'tags' | 'rating'
> & {
  posterUrl: string | null;
  updatedAt: string;
};

export const loadUserRankings = (
  handle: string,
  group: ProfileGroup = 'top',
  category?: string,
): Promise<ProfileRankingSummary[]> =>
  request<ProfileRankingSummary[]>(
    `/api/users/${encodeURIComponent(handle)}/rankings${toQuery({ group, category })}`,
  );

export const isFollowingUser = (handle: string): Promise<{ following: boolean }> =>
  request<{ following: boolean }>(`/api/users/${encodeURIComponent(handle)}/following`);

export const setFollowingUser = (
  handle: string,
  follow: boolean,
): Promise<{ following: boolean; followerCount: number }> =>
  request<{ following: boolean; followerCount: number }>(
    `/api/users/${encodeURIComponent(handle)}/follow`,
    { method: 'POST', body: JSON.stringify({ follow }) },
  );

/* Community -------------------------------------------------------------- */

export const loadLeaderboard = (
  options: { category?: string; limit?: number } = {},
): Promise<LeaderboardEntry[]> => request<LeaderboardEntry[]>(`/api/community/leaderboard${toQuery({ ...options })}`);

export const loadFeed = (
  options: { limit?: number; offset?: number; author?: string; rankingId?: string } = {},
): Promise<ActivityPage> => request<ActivityPage>(`/api/community/feed${toQuery({ ...options })}`);

export const likeActivity = (
  id: string,
): Promise<{ likeCount: number; likedByMe: boolean }> =>
  request<{ likeCount: number; likedByMe: boolean }>(
    `/api/community/feed/${encodeURIComponent(id)}/like`,
    { method: 'POST' },
  );

export const shareActivity = (id: string): Promise<{ shareCount: number }> =>
  request<{ shareCount: number }>(`/api/community/feed/${encodeURIComponent(id)}/share`, {
    method: 'POST',
  });

export const commentOnActivity = (id: string, body: string): Promise<ActivityItem> =>
  request<ActivityItem>(`/api/community/feed/${encodeURIComponent(id)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });

export { ApiRequestError };
