import type { Session } from "./types";

export const REFRESH_STORAGE_KEY = "refresh";

let currentSession: Session | null = null;
const listeners = new Set<() => void>();

export const getSession = () => currentSession;

export const getStoredRefreshToken = () =>
  localStorage.getItem(REFRESH_STORAGE_KEY);

export const setSession = (session: Session | null) => {
  currentSession = session;
  if (session) {
    localStorage.setItem(REFRESH_STORAGE_KEY, session.refresh);
  } else {
    localStorage.removeItem(REFRESH_STORAGE_KEY);
  }
  listeners.forEach((listener) => listener());
};

export const subscribeToSession = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
