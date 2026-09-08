import { RankingItem } from "../types/item";

const configuredApiUrl = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

const API_URL = (() => {
  if (typeof window === "undefined") {
    return configuredApiUrl;
  }

  const apiUrl = new URL(configuredApiUrl);
  const isLocalApi = apiUrl.hostname === "localhost" || apiUrl.hostname === "127.0.0.1";

  if (isLocalApi && window.location.hostname) {
    apiUrl.hostname = window.location.hostname;
  }

  return apiUrl.toString().replace(/\/$/, "");
})();

type RankingInput = Omit<RankingItem, "id" | "createdAt" | "updatedAt">;

type ApiError = {
  message?: string;
};

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
    });
  } catch (error) {
    console.error("Rank Everything API request failed", {
      url: `${API_URL}${path}`,
      message: error instanceof Error ? error.message : String(error),
    });
    throw new Error(`Cannot connect to the API at ${API_URL}. Start the backend and try again.`);
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(errorBody?.message ?? `Request failed with status ${response.status}.`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const loadItems = (): Promise<RankingItem[]> =>
  request<RankingItem[]>("/api/rankings");

export const createItem = (input: RankingInput): Promise<RankingItem> =>
  request<RankingItem>("/api/rankings", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateItem = (
  id: string,
  input: RankingInput,
): Promise<RankingItem> =>
  request<RankingItem>(`/api/rankings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

export const deleteItem = (id: string): Promise<void> =>
  request<void>(`/api/rankings/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

export const getAiSuggestions = (input: {
  name: string;
  notes: string;
}): Promise<{ category: string; rating: number; notes: string }> =>
  request<{ category: string; rating: number; notes: string }>("/api/ai/suggestions", {
    method: "POST",
    body: JSON.stringify(input),
  });
