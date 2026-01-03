import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown"; // Import the library
import "./App.css";

const API_BASE = "https://healthcare-app-4.onrender.com";

function App() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Hi! I’m HealthBot.\n\nDescribe your symptoms and I’ll try to guide you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userMessage }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.answer || "⚠️ I couldn’t understand that.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ Server unreachable. Please try again later.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="app">
      <div className="chat-card">
        <div className="chat-header">
          <div className="h-avatar">🩺</div>
          <div>HealthBot</div>
        </div>

        <div className="chat-body">
          {messages.map((msg, i) => (
            <div key={i} className={`bubble ${msg.sender}`}>
              {/* This component handles the formatting automatically */}
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          ))}

          {loading && (
            <div className="bubble bot typing">
              HealthBot is typing<span>.</span><span>.</span><span>.</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="chat-footer">
          <input
            type="text"
            placeholder="Describe your symptoms..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;