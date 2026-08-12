import { requestTokenRefresh } from "@/api/authEndpoints";
import { getSession, getStoredRefreshToken, setSession } from "@/auth/session";
import type { Session } from "@/auth/types";

let inFlightRefresh: Promise<Session | null> | null = null;

export const refreshSession = (): Promise<Session | null> => {
  if (inFlightRefresh) return inFlightRefresh;

  const refreshToken = getSession()?.refresh ?? getStoredRefreshToken();
  if (!refreshToken) return Promise.resolve(null);

  inFlightRefresh = requestTokenRefresh(refreshToken)
    .then((tokens) => {
      const session = {
        access: tokens.access,
        refresh: tokens.refresh ?? refreshToken,
      };
      setSession(session);
      return session;
    })
    .catch(() => {
      setSession(null);
      return null;
    })
    .finally(() => {
      inFlightRefresh = null;
    });

  return inFlightRefresh;
};
