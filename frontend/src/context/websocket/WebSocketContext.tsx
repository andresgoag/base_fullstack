import { createContext, useContext } from "react";
import type { Socket } from "socket.io-client";

interface WebSocketContextObject {
  socket: Socket | null;
  isConnected: boolean;
  sendEcho: (message: string) => void;
}

export const WebSocketContext = createContext<WebSocketContextObject>({
  socket: null,
  isConnected: false,
  sendEcho: () => {},
});

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider",
    );
  }
  return context;
};
