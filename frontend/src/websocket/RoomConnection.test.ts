import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RoomConnection,
  type ConnectionStatus,
} from "websocket/RoomConnection";
import { WEBSOCKET_CLOSE_CODES } from "websocket/protocol";
import { asWebSocket, FakeWebSocket } from "test/FakeWebSocket";

const buildRoomMessage = (text: string) => ({
  type: "message",
  id: `id-${text}`,
  room: "global",
  sender: "ada@example.com",
  text,
  sent_at: "2026-08-30T02:30:01.104262Z",
});

const startConnection = (accessToken: string | null = "token-1") => {
  const statuses: ConnectionStatus[] = [];
  const messages: { text: string }[] = [];
  const failures: {
    code: number | null;
    message: string;
    isRecoverable: boolean;
  }[] = [];
  const connection = new RoomConnection({
    roomName: "global",
    getAccessToken: () => Promise.resolve(accessToken),
    onMessage: (message) => messages.push(message),
    onStatusChange: (status) => statuses.push(status),
    onFailure: (failure) => failures.push(failure),
    createSocket: (url) => asWebSocket(new FakeWebSocket(url)),
  });
  connection.start();
  return { connection, statuses, messages, failures };
};

const authenticate = async () => {
  FakeWebSocket.last.open();
  await vi.waitFor(() => {
    expect(FakeWebSocket.last.sent).toHaveLength(1);
  });
  FakeWebSocket.last.receive({ type: "auth_ok", user_id: 1 });
};

describe("RoomConnection", () => {
  beforeEach(() => {
    FakeWebSocket.reset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("authenticates as soon as the socket opens", async () => {
    const { connection } = startConnection();

    await authenticate();

    expect(JSON.parse(FakeWebSocket.last.sent[0])).toEqual({
      type: "auth",
      token: "token-1",
    });
    connection.stop();
  });

  it("reports it is ready once the server accepts the token", async () => {
    const { connection, statuses } = startConnection();

    await authenticate();

    expect(statuses).toEqual(["connecting", "authenticating", "ready"]);
    connection.stop();
  });

  it("stops when there is no token to authenticate with", async () => {
    const { connection, statuses, failures } = startConnection(null);

    FakeWebSocket.last.open();
    await vi.waitFor(() => {
      expect(failures).toHaveLength(1);
    });

    expect(failures[0].isRecoverable).toBe(false);
    expect(statuses.at(-1)).toBe("closed");
    connection.stop();
  });

  it("delivers room messages and ignores anything unparseable", async () => {
    const { connection, messages } = startConnection();
    await authenticate();

    FakeWebSocket.last.receive(buildRoomMessage("hello"));
    FakeWebSocket.last.receive("not json");
    FakeWebSocket.last.receive({ type: "unknown" });

    expect(messages.map((message) => message.text)).toEqual(["hello"]);
    connection.stop();
  });

  it("queues a message sent before the room is ready and flushes it", async () => {
    const { connection } = startConnection();

    expect(connection.send("early")).toBe(false);
    await authenticate();

    const payloads = FakeWebSocket.last.sent.map(
      (item) => JSON.parse(item) as { type: string; text?: string },
    );
    expect(payloads.at(-1)).toEqual({ type: "message", text: "early" });
    connection.stop();
  });

  it("reconnects after the connection drops", async () => {
    const { connection, statuses } = startConnection();
    await authenticate();

    FakeWebSocket.last.closeFromServer(1006);
    await vi.advanceTimersByTimeAsync(600);

    expect(FakeWebSocket.instances).toHaveLength(2);
    expect(statuses.at(-1)).toBe("reconnecting");
    connection.stop();
  });

  it("backs off further on each failed attempt", async () => {
    const { connection } = startConnection();
    await authenticate();

    FakeWebSocket.last.closeFromServer(1006);
    await vi.advanceTimersByTimeAsync(600);
    FakeWebSocket.last.closeFromServer(1006);
    await vi.advanceTimersByTimeAsync(600);
    expect(FakeWebSocket.instances).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(600);
    expect(FakeWebSocket.instances).toHaveLength(3);
    connection.stop();
  });

  it("gives up after the server rejects the session", async () => {
    const { connection, failures } = startConnection();
    await authenticate();

    FakeWebSocket.last.closeFromServer(WEBSOCKET_CLOSE_CODES.unauthorized);
    await vi.advanceTimersByTimeAsync(20_000);

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(failures.at(-1)?.isRecoverable).toBe(false);
    connection.stop();
  });

  it("reconnects after the session expires mid room", async () => {
    const { connection } = startConnection();
    await authenticate();

    FakeWebSocket.last.closeFromServer(WEBSOCKET_CLOSE_CODES.tokenExpired);
    await vi.advanceTimersByTimeAsync(600);

    expect(FakeWebSocket.instances).toHaveLength(2);
    connection.stop();
  });

  it("sends a heartbeat and closes the socket when no pong arrives", async () => {
    const { connection } = startConnection();
    await authenticate();

    await vi.advanceTimersByTimeAsync(25_000);
    expect(JSON.parse(FakeWebSocket.last.sent.at(-1) ?? "{}")).toEqual({
      type: "ping",
    });

    await vi.advanceTimersByTimeAsync(10_000);
    expect(FakeWebSocket.instances[0].readyState).toBe(WebSocket.CLOSED);
    connection.stop();
  });

  it("keeps the socket open when the pong arrives", async () => {
    const { connection } = startConnection();
    await authenticate();

    await vi.advanceTimersByTimeAsync(25_000);
    FakeWebSocket.last.receive({ type: "pong" });
    await vi.advanceTimersByTimeAsync(10_000);

    expect(FakeWebSocket.instances[0].readyState).toBe(WebSocket.OPEN);
    connection.stop();
  });

  it("surfaces an error frame from the server", async () => {
    const { connection, failures } = startConnection();
    await authenticate();

    FakeWebSocket.last.receive({
      type: "error",
      code: "invalid_message",
      detail: "A message needs text.",
    });

    expect(failures.at(-1)?.message).toBe("A message needs text.");
    connection.stop();
  });

  it("does not reconnect once it has been stopped", async () => {
    const { connection } = startConnection();
    await authenticate();

    connection.stop();
    await vi.advanceTimersByTimeAsync(20_000);

    expect(FakeWebSocket.instances).toHaveLength(1);
  });
});
