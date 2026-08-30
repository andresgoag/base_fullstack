import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor } from "@testing-library/react";
import { WebSocketDemo } from "pages/Dashboard/WebSocketDemo";
import { renderWithProviders } from "test/renderWithProviders";
import { asWebSocket, FakeWebSocket } from "test/FakeWebSocket";
import { endAuthSession, startAuthSession } from "auth/authSession";
import { buildAccessToken } from "test/tokens";

vi.mock("api/tokens", () => ({
  loginUser: vi.fn(),
  refreshToken: vi.fn(),
  blacklistToken: vi.fn(),
}));
vi.mock("api/users", () => ({
  registerUser: vi.fn(),
  getCurrentUser: vi.fn().mockResolvedValue({
    id: 1,
    email: "ada@example.com",
    phone: "+14155552671",
    first_name: "Ada",
    last_name: "Lovelace",
  }),
}));

const originalWebSocket = globalThis.WebSocket;

const buildRoomMessage = (text: string) => ({
  type: "message",
  id: `id-${text}`,
  room: "global",
  sender: "ada@example.com",
  text,
  sent_at: "2026-08-30T02:30:01.104262Z",
});

describe("useWebSocket", () => {
  beforeEach(() => {
    localStorage.clear();
    endAuthSession();
    FakeWebSocket.reset();
    globalThis.WebSocket = new Proxy(originalWebSocket, {
      construct: (_target, [url]: [string]) =>
        asWebSocket(new FakeWebSocket(url)),
    });
  });

  it("stays disconnected while nobody is signed in", () => {
    renderWithProviders(<WebSocketDemo />);

    expect(screen.getByText("Disconnected")).toBeInTheDocument();
    expect(FakeWebSocket.instances).toHaveLength(0);
  });

  it("joins the room and shows what the server broadcasts", async () => {
    startAuthSession({ access: buildAccessToken(300_000), refresh: "r1" });
    renderWithProviders(<WebSocketDemo />);

    await waitFor(() => {
      expect(FakeWebSocket.instances).toHaveLength(1);
    });
    act(() => {
      FakeWebSocket.last.open();
    });
    await waitFor(() => {
      expect(FakeWebSocket.last.sent).toHaveLength(1);
    });
    act(() => {
      FakeWebSocket.last.receive({ type: "auth_ok", user_id: 1 });
    });

    expect(await screen.findByText("Connected")).toBeInTheDocument();

    act(() => {
      FakeWebSocket.last.receive(buildRoomMessage("hello room"));
    });

    expect(await screen.findByText("hello room")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });

  it("explains why the room closed", async () => {
    startAuthSession({ access: buildAccessToken(300_000), refresh: "r1" });
    renderWithProviders(<WebSocketDemo />);

    await waitFor(() => {
      expect(FakeWebSocket.instances).toHaveLength(1);
    });
    act(() => {
      FakeWebSocket.last.open();
    });
    await waitFor(() => {
      expect(FakeWebSocket.last.sent).toHaveLength(1);
    });
    act(() => {
      FakeWebSocket.last.closeFromServer(4001);
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The server rejected the session for this room.",
    );
  });
});
