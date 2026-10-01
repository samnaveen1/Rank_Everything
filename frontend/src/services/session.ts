import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'rank-everything:session';

type Listener = (handle: string | null) => void;

type SessionRecord = {
  handle: string;
  token?: string | null;
  email?: string | null;
  name?: string | null;
};

const listeners = new Set<Listener>();
let activeHandle: string | null = null;
let activeToken: string | null = null;

export const normalizeHandle = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9_.]/g, '')
    .slice(0, 32);

export const isValidHandle = (value: string): boolean =>
  /^[a-z0-9_.]{3,32}$/.test(normalizeHandle(value));

export const getSessionHandle = (): string | null => activeHandle;
export const getSessionToken = (): string | null => activeToken;

export const setSessionHandle = (handle: string | null): void => {
  activeHandle = handle;
};

export const subscribeToSession = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const emit = (handle: string | null): void => {
  activeHandle = handle;
  listeners.forEach((listener) => listener(handle));
};

export const loadSessionState = async (): Promise<SessionRecord | null> => {
  try {
    const stored = await AsyncStorage.getItem(SESSION_KEY);

    if (!stored) {
      emit(null);
      activeToken = null;
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<SessionRecord>;
    const handle = parsed.handle ? normalizeHandle(parsed.handle) : null;
    activeToken = typeof parsed.token === 'string' && parsed.token.length > 0 ? parsed.token : null;
    emit(handle && activeToken ? handle : null);

    return handle && activeToken
      ? { handle, token: activeToken, email: parsed.email ?? null, name: parsed.name ?? null }
      : null;
  } catch (error) {
    console.warn('Could not read the saved session', error);
    activeToken = null;
    emit(null);
    return null;
  }
};

export const loadSessionHandle = async (): Promise<string | null> => {
  const state = await loadSessionState();
  return state?.handle ?? null;
};

export const signInAs = async (
  rawHandle: string,
  rawToken?: string | null,
  persist = true,
): Promise<string> => {
  const handle = normalizeHandle(rawHandle);

  if (!handle) {
    throw new Error('Pick a username to continue.');
  }

  if (!rawToken) {
    throw new Error('Authentication could not be established.');
  }

  const session: SessionRecord = { handle, token: rawToken ?? null };
  if (persist) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    await AsyncStorage.removeItem(SESSION_KEY);
  }
  activeToken = session.token ?? null;
  emit(handle);
  return handle;
};

export const signOut = async (): Promise<void> => {
  await AsyncStorage.removeItem(SESSION_KEY);
  activeToken = null;
  emit(null);
};
