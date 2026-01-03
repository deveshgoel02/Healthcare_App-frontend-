import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const API_BASE = "https://healthcare-app-4.onrender.com";

function App() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Hi! I’m **HealthBot**.\nTell me your symptoms and I’ll try to guide you.",
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
        text: data.answer || "⚠️ I couldn’t understand that. Try again.",
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ Sorry, I’m unable to reach the server right now.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="app">
      <div className="chat-card">
        <div className="chat-header">🩺 HealthBot</div>

        <div className="chat-body">
          {messages.map((msg, i) => (
            <div key={i} className={`bubble ${msg.sender}`}>
              {msg.text.split("\n").map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
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
