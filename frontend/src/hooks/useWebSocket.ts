import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthContext } from "context/auth/AuthContext";
import { WS_BASE_URL } from "config";

export type WebSocketMessage = {
  id: number;
  text: string;
};

export const useWebSocket = (roomName: string) => {
  const { access } = useAuthContext();
  const socketRef = useRef<WebSocket | null>(null);
  const messageIdRef = useRef(0);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!access) return;
    const socket = new WebSocket(`${WS_BASE_URL}/ws/echo/${roomName}/`);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "auth", token: access }));
    };

    socket.onclose = () => setIsAuthenticated(false);

    socket.onmessage = (event) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        parsed = null;
      }
      if (parsed !== null && typeof parsed === "object" && (parsed as Record<string, unknown>).type === "auth_ok") {
        setIsAuthenticated(true);
        return;
      }
      setMessages((prev) => [
        ...prev,
        { id: messageIdRef.current++, text: event.data },
      ]);
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      socketRef.current = null;
    };
  }, [access, roomName]);

  const sendMessage = useCallback((message: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
    }
  }, []);

  return { messages, isAuthenticated, sendMessage };
};
