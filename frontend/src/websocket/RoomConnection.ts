import { WS_BASE_URL } from "config";
import { translate } from "i18n/config";
import {
  buildRoomUrl,
  describeCloseCode,
  isRecoverableCloseCode,
  parseServerMessage,
  type RoomMessage,
} from "websocket/protocol";

export type ConnectionStatus =
  "connecting" | "authenticating" | "ready" | "reconnecting" | "closed";

export type ConnectionFailure = {
  code: number | null;
  message: string;
  isRecoverable: boolean;
};

export type RoomConnectionOptions = {
  roomName: string;
  getAccessToken: () => Promise<string | null>;
  onMessage: (message: RoomMessage) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onFailure: (failure: ConnectionFailure) => void;
  createSocket?: (url: string) => WebSocket;
};

const RECONNECT_DELAYS_MS = [500, 1000, 2000, 5000, 10_000];
const HEARTBEAT_INTERVAL_MS = 25_000;
const HEARTBEAT_TIMEOUT_MS = 10_000;
const MAX_QUEUED_MESSAGES = 50;

const openSocket = (url: string): WebSocket => new WebSocket(url);

export class RoomConnection {
  private readonly options: RoomConnectionOptions;
  private socket: WebSocket | null = null;
  private queuedMessages: string[] = [];
  private reconnectAttempt = 0;
  private isStopped = false;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private pongTimer: number | null = null;

  constructor(options: RoomConnectionOptions) {
    this.options = options;
  }

  start(): void {
    this.isStopped = false;
    this.openSocket();
  }

  stop(): void {
    this.isStopped = true;
    this.clearTimers();
    this.queuedMessages = [];
    this.closeSocket();
    this.socket = null;
    this.options.onStatusChange("closed");
  }

  send(text: string): boolean {
    if (this.socket !== null && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "message", text }));
      return true;
    }
    this.queuedMessages = [...this.queuedMessages, text].slice(
      -MAX_QUEUED_MESSAGES,
    );
    return false;
  }

  private openSocket(): void {
    const createSocket = this.options.createSocket ?? openSocket;
    this.options.onStatusChange(
      this.reconnectAttempt === 0 ? "connecting" : "reconnecting",
    );
    const socket = createSocket(
      buildRoomUrl(WS_BASE_URL, this.options.roomName),
    );
    this.socket = socket;
    socket.onopen = () => {
      void this.authenticate(socket);
    };
    socket.onmessage = (event: MessageEvent<string>) => {
      this.handleServerMessage(event.data);
    };
    socket.onerror = () => {
      this.options.onFailure({
        code: null,
        message: translate("websocket.failed"),
        isRecoverable: true,
      });
    };
    socket.onclose = (event: CloseEvent) => {
      this.handleClose(event.code);
    };
  }

  private async authenticate(socket: WebSocket): Promise<void> {
    this.options.onStatusChange("authenticating");
    const accessToken = await this.options.getAccessToken();
    if (socket !== this.socket || socket.readyState !== WebSocket.OPEN) return;
    if (accessToken === null) {
      this.options.onFailure({
        code: null,
        message: translate("websocket.signInRequired"),
        isRecoverable: false,
      });
      this.stop();
      return;
    }
    socket.send(JSON.stringify({ type: "auth", token: accessToken }));
  }

  private handleServerMessage(payload: string): void {
    const message = parseServerMessage(payload);
    if (message === null) return;
    if (message.type === "auth_ok") {
      this.reconnectAttempt = 0;
      this.options.onStatusChange("ready");
      this.startHeartbeat();
      this.flushQueue();
      return;
    }
    if (message.type === "pong") {
      this.clearPongTimer();
      return;
    }
    if (message.type === "error") {
      this.options.onFailure({
        code: null,
        message: message.detail,
        isRecoverable: true,
      });
      return;
    }
    this.options.onMessage(message);
  }

  private handleClose(code: number): void {
    this.clearTimers();
    this.socket = null;
    if (this.isStopped) {
      this.options.onStatusChange("closed");
      return;
    }
    if (!isRecoverableCloseCode(code)) {
      this.isStopped = true;
      this.options.onStatusChange("closed");
      this.options.onFailure({
        code,
        message: describeCloseCode(code),
        isRecoverable: false,
      });
      return;
    }
    this.options.onFailure({
      code,
      message: describeCloseCode(code),
      isRecoverable: true,
    });
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    const delay =
      RECONNECT_DELAYS_MS[
        Math.min(this.reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)
      ];
    this.reconnectAttempt += 1;
    this.options.onStatusChange("reconnecting");
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isStopped) this.openSocket();
    }, delay);
  }

  private startHeartbeat(): void {
    this.clearHeartbeatTimers();
    this.heartbeatTimer = window.setInterval(() => {
      if (this.socket === null || this.socket.readyState !== WebSocket.OPEN) {
        return;
      }
      this.socket.send(JSON.stringify({ type: "ping" }));
      this.pongTimer = window.setTimeout(() => {
        this.pongTimer = null;
        this.closeSocket();
      }, HEARTBEAT_TIMEOUT_MS);
    }, HEARTBEAT_INTERVAL_MS);
  }

  private flushQueue(): void {
    const pending = this.queuedMessages;
    this.queuedMessages = [];
    pending.forEach((text) => {
      this.send(text);
    });
  }

  private closeSocket(): void {
    const socket = this.socket;
    if (socket === null) return;
    if (socket.readyState === WebSocket.CONNECTING) {
      socket.onopen = () => {
        socket.close();
      };
      return;
    }
    if (socket.readyState === WebSocket.OPEN) socket.close();
  }

  private clearPongTimer(): void {
    if (this.pongTimer !== null) {
      window.clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  private clearHeartbeatTimers(): void {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.clearPongTimer();
  }

  private clearTimers(): void {
    this.clearHeartbeatTimers();
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
