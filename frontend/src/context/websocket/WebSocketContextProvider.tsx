import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { WebSocketContext } from "./WebSocketContext";
import { useAuthContext } from "context/auth/AuthContext";
import { useToastContext } from "context/toast/ToastContext";
import { useNavigate } from "react-router";

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

if (!WEBSOCKET_URL) {
  throw new Error("VITE_WEBSOCKET_URL environment variable is not set");
}

type ContextProps = {
  children: React.ReactNode;
};

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000;
    return Date.now() >= exp;
  } catch {
    return true;
  }
};

export const WebSocketContextProvider = ({ children }: ContextProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { access, logout } = useAuthContext();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!access) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    if (isTokenExpired(access)) {
      showToast({
        type: "warning",
        message: "Session expired. Please log in again.",
      });
      logout();
      navigate("/auth/login");
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
      const errorMessage = error.message.toLowerCase();

      if (
        errorMessage.includes("authentication") ||
        errorMessage.includes("token") ||
        errorMessage.includes("unauthorized")
      ) {
        showToast({
          type: "danger",
          message: "Authentication failed. Please log in again.",
        });
        logout();
        navigate("/auth/login");
      } else {
        showToast({
          type: "danger",
          message: "WebSocket connection failed. Please try again later.",
        });
      }
    });

    newSocket.on("connected", (data) => {
      showToast({
        type: "success",
        message: data.message,
      });
    });

    newSocket.on("error", (data) => {
      showToast({
        type: "danger",
        message: data.message || "An error occurred",
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
