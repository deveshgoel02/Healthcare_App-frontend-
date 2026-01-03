import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const API_BASE = "https://healthcare-app-4.onrender.com";

function App() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text:
        "👋 Hi! I’m HealthBot.\n\n" +
        "Tell me your symptoms and I’ll try to guide you step by step.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      const data = await res.json();

      const botMsg = {
        sender: "bot",
        text:
          data.answer ||
          "⚠️ I couldn’t understand that. Please try again.",
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            "⚠️ Sorry, I’m unable to reach the server right now.\n" +
            "Please try again in a moment.",
        },
      ]);
    }

    setLoading(false);
  };

  // 🔥 Formatter for bot messages
  const renderFormattedText = (text) => {
    return text.split("\n").map((line, idx) => {
      // Headings
      if (line.toLowerCase().includes("common causes") ||
          line.toLowerCase().includes("what you can do") ||
          line.toLowerCase().includes("seek medical help")) {
        return (
          <p key={idx} style={{ fontWeight: "600", marginTop: "12px" }}>
            {line}
          </p>
        );
      }

      // Bullet points
      if (line.startsWith("-")) {
        return (
          <p key={idx} style={{ marginLeft: "12px" }}>
            • {line.replace("-", "").trim()}
          </p>
        );
      }

      // Normal text
      return <p key={idx}>{line}</p>;
    });
  };

  return (
    <div className="app">
      <div className="chat-card">
        <div className="chat-header">🩺 HealthBot</div>

        <div className="chat-body">
          {messages.map((msg, i) => (
            <div key={i} className={`bubble ${msg.sender}`}>
              {renderFormattedText(msg.text)}
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
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;
