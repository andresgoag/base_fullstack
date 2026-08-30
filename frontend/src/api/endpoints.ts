import type { paths } from "api/schema";

const asEndpoint = <Path extends keyof paths>(path: Path): Path => path;

export const API_ENDPOINTS = {
  createToken: asEndpoint("/api/v1/auth/jwt/create/"),
  refreshToken: asEndpoint("/api/v1/auth/jwt/refresh/"),
  blacklistToken: asEndpoint("/api/v1/auth/jwt/blacklist/"),
  users: asEndpoint("/api/v1/auth/users/"),
  currentUser: asEndpoint("/api/v1/auth/users/me/"),
  setPassword: asEndpoint("/api/v1/auth/users/set_password/"),
  requestPasswordReset: asEndpoint("/api/v1/auth/users/reset_password/"),
  confirmPasswordReset: asEndpoint(
    "/api/v1/auth/users/reset_password_confirm/",
  ),
  activate: asEndpoint("/api/v1/auth/users/activation/"),
  resendActivation: asEndpoint("/api/v1/auth/users/resend_activation/"),
  similarComments: asEndpoint("/api/v1/comments/similar/"),
};
