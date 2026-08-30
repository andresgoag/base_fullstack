import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ensureFreshAccessToken,
  getAuthSession,
  subscribeToAuthSession,
} from "auth/authSession";
import { queryKeys } from "queries/queryKeys";
import {
  RoomConnection,
  type ConnectionFailure,
  type ConnectionStatus,
} from "websocket/RoomConnection";
import type { RoomMessage } from "websocket/protocol";

const MAX_KEPT_MESSAGES = 200;

const appendMessage = (
  messages: RoomMessage[],
  message: RoomMessage,
): RoomMessage[] =>
  messages.some((kept) => kept.id === message.id)
    ? messages
    : [...messages, message].slice(-MAX_KEPT_MESSAGES);

export const useWebSocket = (roomName: string) => {
  const queryClient = useQueryClient();
  const session = useSyncExternalStore(subscribeToAuthSession, getAuthSession);
  const isSignedIn = session.access !== null;
  const [socketStatus, setSocketStatus] = useState<ConnectionStatus>("closed");
  const [failure, setFailure] = useState<ConnectionFailure | null>(null);
  const connectionRef = useRef<RoomConnection | null>(null);
  const messagesKey = queryKeys.websocket.room(roomName);

  const { data: messages = [] } = useQuery({
    queryKey: messagesKey,
    queryFn: (): RoomMessage[] => [],
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (!isSignedIn) return;
    const connection = new RoomConnection({
      roomName,
      getAccessToken: async () => {
        await ensureFreshAccessToken();
        return getAuthSession().access;
      },
      onMessage: (message) => {
        queryClient.setQueryData<RoomMessage[]>(
          queryKeys.websocket.room(roomName),
          (current = []) => appendMessage(current, message),
        );
      },
      onStatusChange: setSocketStatus,
      onFailure: setFailure,
    });
    connectionRef.current = connection;
    connection.start();
    return () => {
      connection.stop();
      connectionRef.current = null;
    };
  }, [roomName, isSignedIn, queryClient]);

  const sendMessage = useCallback(
    (text: string): boolean => connectionRef.current?.send(text) ?? false,
    [],
  );

  const status: ConnectionStatus = isSignedIn ? socketStatus : "closed";

  return {
    messages,
    status,
    failure,
    isReady: status === "ready",
    sendMessage,
  };
};
