import { useEffect, useRef, useState, useCallback } from "react";
import { WS_BASE_URL } from "@/config";
import { useSession } from "@/auth/useSession";

const RECONNECT_DELAY_MS = 2000;
const MAX_RETAINED_MESSAGES = 200;

export type WebSocketMessage = {
  id: number;
  text: string;
};

type ServerFrame =
  | { type: "auth_ok"; user_id: number; expires_at: string }
  | { type: "message"; text: string };

const parseServerFrame = (data: unknown): ServerFrame | null => {
  if (typeof data !== "string") return null;
  try {
    const frame = JSON.parse(data);
    if (frame?.type === "auth_ok" || frame?.type === "message") return frame;
    return null;
  } catch {
    return null;
  }
};

export const useWebSocket = (roomName: string) => {
  const session = useSession();
  const accessToken = session?.access ?? null;
  const socketRef = useRef<WebSocket | null>(null);
  const messageIdRef = useRef(0);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    let isDisposed = false;
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      const socket = new WebSocket(`${WS_BASE_URL}/ws/echo/${roomName}/`);
      socketRef.current = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify({ type: "auth", token: accessToken }));
      };

      socket.onmessage = (event) => {
        const frame = parseServerFrame(event.data);
        if (!frame) return;
        if (frame.type === "auth_ok") {
          setIsAuthenticated(true);
          return;
        }
        setMessages((previous) =>
          [...previous, { id: messageIdRef.current++, text: frame.text }].slice(
            -MAX_RETAINED_MESSAGES,
          ),
        );
      };

      socket.onclose = () => {
        setIsAuthenticated(false);
        if (isDisposed) return;
        reconnectTimeout = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    };

    connect();

    return () => {
      isDisposed = true;
      clearTimeout(reconnectTimeout);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [accessToken, roomName]);

  const sendMessage = useCallback((text: string) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ type: "message", text }));
  }, []);

  return { messages, isAuthenticated, sendMessage };
};
