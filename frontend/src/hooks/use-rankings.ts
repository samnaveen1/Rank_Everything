import { useCallback, useEffect, useMemo, useState } from 'react';

import { loadCategories, loadRankings } from '@/services/api';
import { RankingItem, RankingPage } from '@/types/item';

/** Categories the UI always offers, even before any data exists. */
const CATEGORY_SEED = ['All', 'Movies', 'Restaurants', 'Travel', 'Books', 'Web Series', 'Games'];

type UseRankingsOptions = {
  author?: string;
  category?: string;
  query?: string;
  pageSize?: number;
  sort?: 'rating' | 'recent';
  enabled?: boolean;
};

type UseRankingsResult = {
  items: RankingItem[];
  total: number;
  page: number;
  pageCount: number;
  /** True only for the first load; later refetches keep the stale list visible. */
  loading: boolean;
  loadingMore: boolean;
  error: string;
  hasMore: boolean;
  categories: string[];
  refresh: () => void;
  loadMore: () => void;
  goToPage: (page: number) => void;
  upsertItem: (item: RankingItem) => void;
  removeItem: (id: string) => void;
};

const mergeCategories = (fromApi: string[]): string[] => {
  const seen = new Set<string>();
  return [...CATEGORY_SEED, ...fromApi].filter((category) => {
    const key = category.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

/**
 * Coerces whatever the API returned into a `RankingPage`. Older or misdirected
 * servers answer `/api/rankings` with a bare array, which used to leave `items`
 * undefined and crash the list on `.length`. Normalizing here keeps a bad
 * response a visible error instead of a red screen.
 */
const normalizeRankingPage = (payload: unknown, requestedPage: number): RankingPage => {
  const source: Partial<RankingPage> = Array.isArray(payload)
    ? { items: payload as RankingItem[] }
    : ((payload ?? {}) as Partial<RankingPage>);

  if (!Array.isArray(source.items)) {
    throw new Error(
      'The API returned an unexpected response. Check that EXPO_PUBLIC_API_URL points at this backend.',
    );
  }

  const items = source.items.filter((item): item is RankingItem => Boolean(item?.id));

  return {
    items,
    total: typeof source.total === 'number' ? source.total : items.length,
    page: typeof source.page === 'number' ? source.page : requestedPage,
    pageSize: typeof source.pageSize === 'number' ? source.pageSize : items.length,
  };
};

/**
 * Owns a ranking list's data: server-side pagination, category filtering,
 * debounced search, and infinite scroll with optional explicit page jumps.
 */
export function useRankings({
  author,
  category,
  query,
  pageSize = 10,
  sort = 'rating',
  enabled = true,
}: UseRankingsOptions = {}): UseRankingsResult {
  const [items, setItems] = useState<RankingItem[]>([]);
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [ready, setReady] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [nonce, setNonce] = useState(0);

  const debouncedQuery = useDebounced(query ?? '', 280);

  // Pure request helper: it never touches state, so both the effect below and
  // the imperative handlers below can share it safely.
  const request = useCallback(
    async (targetPage: number): Promise<RankingPage> => {
      const payload = await loadRankings({
        category,
        query: debouncedQuery || undefined,
        author,
        sort,
        page: targetPage,
        pageSize,
      });

      return normalizeRankingPage(payload, targetPage);
    },
    [author, category, debouncedQuery, pageSize, sort],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    // Everything below awaits the network before setting state, which keeps the
    // effect body free of synchronous renders.
    void (async () => {
      try {
        const result = await request(1);
        if (cancelled) {
          return;
        }
        setItems(result.items);
        setTotal(result.total);
        setPage(1);
        setReady(true);
        setError('');
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        console.error(loadError);
        setError(errorMessage(loadError, 'Unable to load rankings. Is the API running?'));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, request, nonce]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;

    void (async () => {
      try {
        const values = await loadCategories();
        if (!cancelled) {
          setApiCategories(values);
        }
      } catch {
        // The seeded category list already covers the common cases.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, nonce]);

  const loadMore = useCallback(() => {
    setLoadingMore(true);
    void (async () => {
      try {
        const result = await request(page + 1);
        // De-dupe by id: overlapping pages would otherwise show a poster twice.
        setItems((current) => {
          const seen = new Set(current.map((item) => item.id));
          return [...current, ...result.items.filter((item) => !seen.has(item.id))];
        });
        setTotal(result.total);
        setPage(page + 1);
      } catch (loadError) {
        console.error(loadError);
        setError(errorMessage(loadError, 'Could not load more rankings.'));
      } finally {
        setLoadingMore(false);
      }
    })();
  }, [page, request]);

  const goToPage = useCallback(
    (target: number) => {
      setLoadingMore(true);
      void (async () => {
        try {
          const result = await request(target);
          setItems(result.items);
          setTotal(result.total);
          setPage(target);
          setError('');
        } catch (loadError) {
          console.error(loadError);
          setError(errorMessage(loadError, 'Could not load that page.'));
        } finally {
          setLoadingMore(false);
        }
      })();
    },
    [request],
  );

  const refresh = useCallback(() => setNonce((value) => value + 1), []);

  const upsertItem = useCallback((item: RankingItem) => {
    setItems((current) => {
      const index = current.findIndex((existing) => existing.id === item.id);
      if (index === -1) {
        return [item, ...current];
      }
      const next = [...current];
      next[index] = item;
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    setTotal((current) => Math.max(0, current - 1));
  }, []);

  const categories = useMemo(() => mergeCategories(apiCategories), [apiCategories]);

  return {
    items,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    loading: !ready,
    loadingMore,
    error,
    hasMore: ready && items.length < total,
    categories,
    refresh,
    loadMore,
    goToPage,
    upsertItem,
    removeItem,
  };
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
