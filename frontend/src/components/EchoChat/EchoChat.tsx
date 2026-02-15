import { useState, useEffect } from "react";
import { Form, Button, Card, ListGroup, Badge } from "react-bootstrap";
import { useWebSocketContext } from "context/websocket/WebSocketContext";

interface EchoMessage {
  message: string;
  username: string;
  timestamp: string;
}

const generateMessageId = (msg: EchoMessage): string => {
  return `${msg.timestamp}-${msg.username}-${msg.message}`;
};

export const EchoChat = () => {
  const { socket, isConnected, sendEcho } = useWebSocketContext();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<EchoMessage[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleEchoResponse = (data: EchoMessage) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("echo_response", handleEchoResponse);

    return () => {
      socket.off("echo_response", handleEchoResponse);
    };
  }, [socket]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendEcho(message);
      setMessage("");
    }
  };

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">
          WebSocket Echo Chat{" "}
          <Badge bg={isConnected ? "success" : "secondary"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </h5>
      </Card.Header>
      <Card.Body>
        <ListGroup
          className="mb-3"
          style={{ maxHeight: "300px", overflowY: "auto" }}
        >
          {messages.length === 0 ? (
            <ListGroup.Item className="text-muted">
              No messages yet. Send a message to see the echo!
            </ListGroup.Item>
          ) : (
            messages.map((msg) => (
              <ListGroup.Item key={generateMessageId(msg)}>
                <div className="d-flex justify-content-between">
                  <div>
                    <strong>{msg.username}:</strong> {msg.message}
                  </div>
                  <small className="text-muted">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </small>
                </div>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!isConnected}
            />
            {!isConnected && (
              <Form.Text className="text-muted">
                Connect to WebSocket to send messages
              </Form.Text>
            )}
          </Form.Group>
          <Button
            type="submit"
            variant="primary"
            disabled={!isConnected || !message.trim()}
          >
            Send Echo
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};
