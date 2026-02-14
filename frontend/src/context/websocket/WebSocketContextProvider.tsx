import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { WebSocketContext } from "./WebSocketContext";
import { useAuthContext } from "context/auth/AuthContext";
import { useToastContext } from "context/toast/ToastContext";

const WEBSOCKET_URL =
  import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:8000";

type ContextProps = {
  children: React.ReactNode;
};

export const WebSocketContextProvider = ({ children }: ContextProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { access } = useAuthContext();
  const { showToast } = useToastContext();

  useEffect(() => {
    if (!access) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io(WEBSOCKET_URL, {
      auth: {
        token: access,
      },
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      showToast({
        type: "danger",
        message:
          "WebSocket connection failed. Please check your authentication.",
      });
    });

    newSocket.on("connected", (data) => {
      showToast({
        type: "success",
        message: data.message,
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access, showToast]);

  const sendEcho = useCallback(
    (message: string) => {
      if (socket && isConnected) {
        socket.emit("echo", { message });
      } else {
        showToast({
          type: "warning",
          message: "Not connected to WebSocket server",
        });
      }
    },
    [socket, isConnected, showToast],
  );

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        sendEcho,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
