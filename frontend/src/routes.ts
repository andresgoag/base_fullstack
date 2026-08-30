export const ROUTES = {
  dashboard: "/",
  home: "/home",
  websocket: "/websocket",
  account: "/account",
  comments: "/comments",
  auth: "/auth",
  login: "/auth/login",
  register: "/auth/register",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password/:uid/:token",
  activate: "/auth/activate/:uid/:token",
  resendActivation: "/auth/resend-activation",
  authNotFound: "/auth/*",
  notFound: "*",
} as const;

const isSafeInternalPath = (value: string): boolean =>
  value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\");

export const resolveInternalPath = (value: unknown): string =>
  typeof value === "string" && isSafeInternalPath(value)
    ? value
    : ROUTES.dashboard;

export const getRedirectTarget = (state: unknown): string =>
  typeof state === "object" && state !== null && "from" in state
    ? resolveInternalPath(state.from)
    : ROUTES.dashboard;
