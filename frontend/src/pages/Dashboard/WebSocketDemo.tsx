import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useWebSocket } from "hooks/useWebSocket";
import { prefersReducedMotion } from "a11y/motion";
import type { ConnectionStatus } from "websocket/RoomConnection";

const STATUS_STYLES: Record<ConnectionStatus, string> = {
  connecting: "text-warning-emphasis",
  authenticating: "text-warning-emphasis",
  ready: "text-success-emphasis",
  reconnecting: "text-warning-emphasis",
  closed: "text-danger-emphasis",
};

export const WebSocketDemo = () => {
  const { t, i18n } = useTranslation();
  const { messages, status, failure, isReady, sendMessage } =
    useWebSocket("global");
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInput("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") handleSend();
  };

  const formatTime = (isoTimestamp: string): string =>
    new Intl.DateTimeFormat(i18n.language, { timeStyle: "medium" }).format(
      new Date(isoTimestamp),
    );

  return (
    <div className="container mt-3">
      <h1>{t("websocket.heading")}</h1>
      <p className="text-muted" role="status">
        {t("websocket.statusLabel")}:{" "}
        <span className={STATUS_STYLES[status]}>
          {t(`websocket.status.${status}`)}
        </span>
      </p>
      {failure && (
        <div
          className={`alert ${failure.isRecoverable ? "alert-warning" : "alert-danger"}`}
          role="alert"
        >
          {failure.message}
        </div>
      )}
      <div
        className="border rounded p-3 mb-3 bg-body-secondary"
        style={{ height: "300px", overflowY: "auto" }}
      >
        {messages.length === 0 ? (
          <p className="text-muted">{t("websocket.empty")}</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="mb-1">
              <span className="text-muted me-2">
                {formatTime(message.sent_at)}
              </span>
              <span className="fw-semibold me-2">{message.sender}</span>
              <span>{message.text}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-group">
        <label htmlFor="websocket-message" className="visually-hidden">
          {t("websocket.messageLabel")}
        </label>
        <input
          type="text"
          id="websocket-message"
          className="form-control"
          placeholder={t("websocket.messagePlaceholder")}
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          className="btn btn-primary"
          onClick={handleSend}
          disabled={!isReady}
        >
          {t("websocket.send")}
        </button>
      </div>
    </div>
  );
};
