import * as z from "zod";
import { WEBSOCKET_CLOSE_CODES } from "websocket/protocolCodes";
import { translate } from "i18n/config";

const CLOSE_REASON_KEYS: Record<number, string> = {
  [WEBSOCKET_CLOSE_CODES.unauthorized]: "websocket.closeReason.unauthorized",
  [WEBSOCKET_CLOSE_CODES.messageTooLarge]:
    "websocket.closeReason.messageTooLarge",
  [WEBSOCKET_CLOSE_CODES.tokenExpired]: "websocket.closeReason.tokenExpired",
  [WEBSOCKET_CLOSE_CODES.authTimeout]: "websocket.closeReason.authTimeout",
  [WEBSOCKET_CLOSE_CODES.rateLimitExceeded]:
    "websocket.closeReason.rateLimitExceeded",
};

const UNRECOVERABLE_CLOSE_CODES: ReadonlySet<number> = new Set([
  WEBSOCKET_CLOSE_CODES.unauthorized,
  WEBSOCKET_CLOSE_CODES.rateLimitExceeded,
]);

export { WEBSOCKET_CLOSE_CODES };

export const describeCloseCode = (code: number): string =>
  translate(CLOSE_REASON_KEYS[code] ?? "websocket.closeReason.unknown");

export const isRecoverableCloseCode = (code: number): boolean =>
  !UNRECOVERABLE_CLOSE_CODES.has(code);

export const roomMessageSchema = z.object({
  type: z.literal("message"),
  id: z.string(),
  room: z.string(),
  sender: z.string(),
  text: z.string(),
  sent_at: z.iso.datetime({ offset: true }),
});

export const authAcknowledgementSchema = z.object({
  type: z.literal("auth_ok"),
  user_id: z.number(),
});

export const pongSchema = z.object({ type: z.literal("pong") });

export const serverErrorSchema = z.object({
  type: z.literal("error"),
  code: z.string(),
  detail: z.string(),
});

export const serverMessageSchema = z.discriminatedUnion("type", [
  roomMessageSchema,
  authAcknowledgementSchema,
  pongSchema,
  serverErrorSchema,
]);

export type RoomMessage = z.infer<typeof roomMessageSchema>;
export type ServerMessage = z.infer<typeof serverMessageSchema>;

export const parseServerMessage = (payload: string): ServerMessage | null => {
  try {
    const result = serverMessageSchema.safeParse(JSON.parse(payload));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};

export const buildRoomUrl = (baseUrl: string, roomName: string): string =>
  `${baseUrl}/ws/echo/${encodeURIComponent(roomName)}/`;
