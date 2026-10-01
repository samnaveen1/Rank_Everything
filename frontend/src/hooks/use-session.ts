import { useEffect, useState } from 'react';

import { loadCurrentAuthUser } from '@/services/auth';
import {
    signOut as clearSession,
    getSessionHandle,
    getSessionToken,
    isValidHandle,
    loadSessionState,
    signInAs,
    subscribeToSession,
} from '@/services/session';

export type SessionState = {
  handle: string | null;
  token: string | null;
  ready: boolean;
  signIn: (handle: string, token?: string | null, persist?: boolean) => Promise<string>;
  signOut: () => Promise<void>;
};

/**
 * Tracks the persisted session, including the bearer token used by the backend.
 */
export function useSession(): SessionState {
  const [handle, setHandle] = useState<string | null>(() => getSessionHandle());
  const [token, setToken] = useState<string | null>(() => getSessionToken());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const unsubscribe = subscribeToSession((next) => {
      if (active) {
        setHandle(next);
      }
    });

    const restore = async () => {
      const stored = await loadSessionState();
      if (stored?.token) {
        try {
          await loadCurrentAuthUser();
        } catch {
          await clearSession();
        }
      }
    };

    void restore().finally(() => {
      if (active) {
        setHandle(getSessionHandle());
        setToken(getSessionToken());
        setReady(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return {
    handle,
    token,
    ready,
    signIn: async (next: string, nextToken?: string | null, persist = true) => {
      if (!isValidHandle(next)) {
        throw new Error('Use 3-32 letters, numbers, dots, or underscores.');
      }

      const signedIn = await signInAs(next, nextToken ?? null, persist);
      setToken(getSessionToken());
      return signedIn;
    },
    signOut: async () => {
      setToken(null);
      return clearSession();
    },
  };
}
