export const WEBSOCKET_CLOSE_CODES = {
  unauthorized: 4001,
  messageTooLarge: 4002,
  tokenExpired: 4003,
  authTimeout: 4004,
  rateLimitExceeded: 4005,
} as const;

export const WEBSOCKET_ERROR_CODES = {
  invalidMessage: "invalid_message",
  unsupportedType: "unsupported_type",
} as const;

export const MAX_WEBSOCKET_MESSAGE_LENGTH = 4096;
