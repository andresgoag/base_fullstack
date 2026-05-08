import { useState, useRef, useEffect } from "react";
import { MainNavbar } from "components/MainNavbar/MainNavbar";
import { useWebSocket } from "hooks/useWebSocket";

export const WebSocketDemo = () => {
  const { messages, isAuthenticated, sendMessage } = useWebSocket("global");
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <>
      <MainNavbar />
      <div className="container mt-3">
        <h1>WebSocket Echo</h1>
        <p className="text-muted">
          Status:{" "}
          <span className={isAuthenticated ? "text-success" : "text-danger"}>
            {isAuthenticated ? "Authenticated" : "Connecting..."}
          </span>
        </p>
        <div
          className="border rounded p-3 mb-3"
          style={{
            height: "300px",
            overflowY: "auto",
            backgroundColor: "#f8f9fa",
          }}
        >
          {messages.length === 0 ? (
            <p className="text-muted">No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="mb-1">
                {msg.text}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={!isAuthenticated}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
};
