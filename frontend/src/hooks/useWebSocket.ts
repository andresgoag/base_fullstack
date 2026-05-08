import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthContext } from "context/auth/AuthContext";
import { WS_BASE_URL } from "config";

export const useWebSocket = (roomName: string) => {
  const { access } = useAuthContext();
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!access) return;
    const socket = new WebSocket(`${WS_BASE_URL}/ws/echo/${roomName}/`);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "auth", token: access }));
      setIsConnected(true);
    };
    socket.onclose = () => setIsConnected(false);
    socket.onmessage = (event) => setMessages((prev) => [...prev, event.data]);

    return () => socket.close();
  }, [access, roomName]);

  const sendMessage = useCallback((message: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
    }
  }, []);

  return { messages, isConnected, sendMessage };
};
