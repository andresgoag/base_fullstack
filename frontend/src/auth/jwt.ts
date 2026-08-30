const decodeBase64Url = (value: string): string =>
  atob(value.replace(/-/g, "+").replace(/_/g, "/"));

const hasNumericExpiry = (payload: unknown): payload is { exp: number } =>
  typeof payload === "object" &&
  payload !== null &&
  "exp" in payload &&
  typeof payload.exp === "number";

export const getAccessTokenExpiryMs = (token: string): number => {
  try {
    const payload: unknown = JSON.parse(decodeBase64Url(token.split(".")[1]));
    return hasNumericExpiry(payload) ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
};

export const getMillisecondsUntilRefresh = (
  token: string,
  bufferMs: number,
): number => getAccessTokenExpiryMs(token) - Date.now() - bufferMs;

export const isAccessTokenExpiringSoon = (
  token: string,
  bufferMs: number,
): boolean => getMillisecondsUntilRefresh(token, bufferMs) <= 0;
