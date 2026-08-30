export class FakeWebSocket {
  static instances: FakeWebSocket[] = [];

  readonly url: string;
  readyState: number = WebSocket.CONNECTING;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances = [...FakeWebSocket.instances, this];
  }

  static reset(): void {
    FakeWebSocket.instances = [];
  }

  static get last(): FakeWebSocket {
    const instance = FakeWebSocket.instances.at(-1);
    if (instance === undefined) throw new Error("No socket was opened.");
    return instance;
  }

  open(): void {
    this.readyState = WebSocket.OPEN;
    this.onopen?.();
  }

  receive(payload: unknown): void {
    this.onmessage?.({
      data: typeof payload === "string" ? payload : JSON.stringify(payload),
    } as MessageEvent<string>);
  }

  send(data: string): void {
    this.sent = [...this.sent, data];
  }

  close(code = 1000): void {
    if (this.readyState === WebSocket.CLOSED) return;
    this.readyState = WebSocket.CLOSED;
    this.onclose?.({ code } as CloseEvent);
  }

  closeFromServer(code: number): void {
    this.close(code);
  }
}

export const asWebSocket = (socket: FakeWebSocket): WebSocket =>
  socket as unknown as WebSocket;
