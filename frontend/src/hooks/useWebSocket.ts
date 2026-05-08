import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthContext } from "context/auth/AuthContext";
import { WS_BASE_URL } from "config";

export const useWebSocket = (roomName: string) => {
  const { access } = useAuthContext();
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
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
      try {
        const data = JSON.parse(event.data);
        if (data.type === "auth_ok") {
          setIsAuthenticated(true);
          return;
        }
      } catch {
        // plain text message, fall through
      }
      setMessages((prev) => [...prev, event.data]);
    };

    return () => {
      socket.close();
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
