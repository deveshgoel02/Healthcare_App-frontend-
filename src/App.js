import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const API_BASE = "https://healthcare-app-4.onrender.com"; // your backend

function App() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Hi! I’m HealthBot.\nDescribe your symptoms and I’ll try to guide you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 🔹 CLEAN + FORMAT TEXT (FIXES YOUR ISSUE)
  const cleanText = (text) => {
    return text
      .replace(/\*\*/g, "")   // remove **
      .replace(/\*/g, "")     // remove *
      .replace(/•/g, "-");    // normalize bullets
  };

  const renderFormattedText = (text) => {
    const cleaned = cleanText(text);

    return cleaned.split("\n").map((line, idx) => {
      if (!line.trim()) return <br key={idx} />;

      // Section headings
      if (
        line.toLowerCase().includes("possible causes") ||
        line.toLowerCase().includes("relief") ||
        line.toLowerCase().includes("when to seek") ||
        line.toLowerCase().includes("what you can do")
      ) {
        return (
          <p
            key={idx}
            style={{
              fontWeight: "600",
              marginTop: "12px",
            }}
          >
            {line}
          </p>
        );
      }

      // Bullet points
      if (line.startsWith("-")) {
        return (
          <p key={idx} style={{ marginLeft: "16px" }}>
            • {line.replace("-", "").trim()}
          </p>
        );
      }

      return <p key={idx}>{line}</p>;
    });
  };

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
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ Sorry, I can’t reach the server right now.",
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
