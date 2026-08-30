import { describe, expect, it } from "vitest";
import {
  buildRoomUrl,
  describeCloseCode,
  isRecoverableCloseCode,
  parseServerMessage,
  WEBSOCKET_CLOSE_CODES,
} from "websocket/protocol";

describe("parseServerMessage", () => {
  it("reads a room message", () => {
    const payload = {
      type: "message",
      id: "8f2b",
      room: "global",
      sender: "ada@example.com",
      text: "hello",
      sent_at: "2026-08-30T02:30:01.104262Z",
    };

    expect(parseServerMessage(JSON.stringify(payload))).toEqual(payload);
  });

  it("reads an authentication acknowledgement", () => {
    expect(
      parseServerMessage(JSON.stringify({ type: "auth_ok", user_id: 3 })),
    ).toEqual({ type: "auth_ok", user_id: 3 });
  });

  it("reads the timestamp format the server actually sends", () => {
    const payload = {
      type: "message",
      id: "11b0e824",
      room: "global",
      sender: "ada@example.com",
      text: "hello",
      sent_at: "2026-08-30T02:52:58.882005+00:00",
    };

    expect(parseServerMessage(JSON.stringify(payload))).toEqual(payload);
  });

  it("ignores a payload that is not valid json", () => {
    expect(parseServerMessage("not json")).toBeNull();
  });

  it("ignores a message the protocol does not define", () => {
    expect(parseServerMessage(JSON.stringify({ type: "shout" }))).toBeNull();
  });

  it("ignores a room message with a missing field", () => {
    expect(
      parseServerMessage(JSON.stringify({ type: "message", text: "hello" })),
    ).toBeNull();
  });
});

describe("buildRoomUrl", () => {
  it("escapes the room name", () => {
    expect(buildRoomUrl("ws://localhost:8000", "a room/../x")).toBe(
      "ws://localhost:8000/ws/echo/a%20room%2F..%2Fx/",
    );
  });
});

describe("close codes", () => {
  it("explains why the server closed the socket", () => {
    expect(
      describeCloseCode(WEBSOCKET_CLOSE_CODES.rateLimitExceeded),
    ).toContain("Too many messages");
  });

  it("does not reconnect after an unauthorized close", () => {
    expect(isRecoverableCloseCode(WEBSOCKET_CLOSE_CODES.unauthorized)).toBe(
      false,
    );
  });

  it("reconnects after the session expires", () => {
    expect(isRecoverableCloseCode(WEBSOCKET_CLOSE_CODES.tokenExpired)).toBe(
      true,
    );
  });

  it("reconnects after an ordinary close", () => {
    expect(isRecoverableCloseCode(1006)).toBe(true);
  });
});
