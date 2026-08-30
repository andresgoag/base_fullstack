import { refreshToken } from "api/tokens";
import { isAccessTokenExpiringSoon } from "auth/jwt";

const SESSION_STORAGE_KEY = "auth.session";

export const ACCESS_TOKEN_REFRESH_BUFFER_MS = 30_000;

export type AuthSession = {
  access: string | null;
  refresh: string | null;
};

const EMPTY_SESSION: AuthSession = { access: null, refresh: null };

const isAuthSession = (value: unknown): value is AuthSession =>
  typeof value === "object" &&
  value !== null &&
  "access" in value &&
  "refresh" in value &&
  (typeof value.access === "string" || value.access === null) &&
  (typeof value.refresh === "string" || value.refresh === null);

const parseSession = (raw: string | null): AuthSession => {
  if (!raw) return EMPTY_SESSION;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isAuthSession(parsed) ? parsed : EMPTY_SESSION;
  } catch {
    return EMPTY_SESSION;
  }
};

let session: AuthSession = parseSession(
  localStorage.getItem(SESSION_STORAGE_KEY),
);
const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((listener) => {
    listener();
  });
};

const publish = (next: AuthSession) => {
  session = next;
  if (next.refresh === null) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } else {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
  }
  notify();
};

export const getAuthSession = (): AuthSession => session;

export const subscribeToAuthSession = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const startAuthSession = (next: AuthSession): void => {
  publish(next);
};

export const endAuthSession = (): void => {
  publish(EMPTY_SESSION);
};

let inFlightRefresh: Promise<string> | null = null;

const runRefresh = async (currentRefresh: string): Promise<string> => {
  try {
    const refreshed = await refreshToken(currentRefresh);
    publish({
      access: refreshed.access,
      refresh: refreshed.refresh ?? currentRefresh,
    });
    return refreshed.access;
  } catch (error) {
    endAuthSession();
    throw error;
  }
};

export const refreshAuthSession = (): Promise<string> => {
  const currentRefresh = session.refresh;
  if (!currentRefresh) {
    return Promise.reject(new Error("The session has no refresh token."));
  }
  inFlightRefresh ??= runRefresh(currentRefresh).finally(() => {
    inFlightRefresh = null;
  });
  return inFlightRefresh;
};

export const needsSessionRestore = (): boolean =>
  session.refresh !== null &&
  (session.access === null ||
    isAccessTokenExpiringSoon(session.access, ACCESS_TOKEN_REFRESH_BUFFER_MS));

export const ensureFreshAccessToken = async (): Promise<void> => {
  if (!needsSessionRestore()) return;
  try {
    await refreshAuthSession();
  } catch {
    return;
  }
};

export const subscribeToSessionChangesInOtherTabs = (): (() => void) => {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key !== SESSION_STORAGE_KEY) return;
    session = parseSession(event.newValue);
    notify();
  };
  window.addEventListener("storage", handleStorageChange);
  return () => {
    window.removeEventListener("storage", handleStorageChange);
  };
};
